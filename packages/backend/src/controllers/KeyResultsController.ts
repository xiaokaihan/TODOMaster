import { Request, Response } from 'express'
import { BaseController } from './BaseController'
import { ValidationService } from '../services/ValidationService'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'
import {
  CreateKeyResultDto,
  UpdateKeyResultDto,
  KeyResultListQuery,
  UpdateKeyResultProgressDto,
  KeyResultResponse,
  KeyResultDetailResponse
} from '../models/dto/KeyResultDto'
import { KeyResult, KeyResultType, KeyResultStatus } from '../models/entities/KeyResult'

export class KeyResultsController extends BaseController {
  // 获取关键结果列表
  static async getKeyResults(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const query: KeyResultListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string || '',
      type: req.query.type as string || '',
      status: req.query.status as string || '',
      objectiveId: req.query.objectiveId as string || ''
    }

    const { page, limit } = this.validatePagination(
      query.page.toString(),
      query.limit.toString()
    )
    const offset = (page - 1) * limit

    // 构建查询条件
    let baseConditions = ['o.user_id = $1']
    let queryParams: any[] = [userId]
    let paramIndex = 2

    // 搜索条件
    if (query.search) {
      baseConditions.push(`(kr.title ILIKE $${paramIndex} OR kr.description ILIKE $${paramIndex})`)
      queryParams.push(`%${query.search}%`)
      paramIndex++
    }

    // 类型筛选
    if (query.type) {
      baseConditions.push(`kr.type = $${paramIndex}`)
      queryParams.push(query.type)
      paramIndex++
    }

    // 状态筛选
    if (query.status) {
      baseConditions.push(`kr.status = $${paramIndex}`)
      queryParams.push(query.status)
      paramIndex++
    }

    // 目标筛选
    if (query.objectiveId) {
      baseConditions.push(`kr.objective_id = $${paramIndex}`)
      queryParams.push(query.objectiveId)
      paramIndex++
    }

    const whereClause = `WHERE ${baseConditions.join(' AND ')}`

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) 
      FROM key_results kr
      JOIN objectives o ON kr.objective_id = o.id
      ${whereClause}
    `
    const countResult = await pool.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].count)

    // 获取关键结果列表
    const keyResultsQuery = `
      SELECT 
        kr.id, kr.title, kr.description, kr.type, kr.target_value,
        kr.current_value, kr.unit, kr.progress, kr.status,
        kr.objective_id, kr.created_at, kr.updated_at,
        o.title as objective_title
      FROM key_results kr
      JOIN objectives o ON kr.objective_id = o.id
      ${whereClause}
      ORDER BY kr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const keyResultsResult = await pool.query(keyResultsQuery, [...queryParams, limit, offset])

    const keyResults: KeyResultResponse[] = keyResultsResult.rows.map(kr => ({
      id: kr.id,
      title: kr.title,
      description: kr.description,
      type: kr.type,
      targetValue: parseFloat(kr.target_value),
      currentValue: parseFloat(kr.current_value),
      unit: kr.unit,
      progress: parseFloat(kr.progress),
      status: kr.status,
      objectiveId: kr.objective_id,
      createdAt: kr.created_at,
      updatedAt: kr.updated_at
    }))

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    res.json(this.buildPaginatedResponse(keyResults, pagination, 'keyResults'))
  }

  // 获取单个关键结果详情
  static async getKeyResultById(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的关键结果ID')
    }

    // 获取关键结果详情
    const keyResultQuery = `
      SELECT 
        kr.*,
        o.title as objective_title,
        o.category as objective_category,
        o.status as objective_status
      FROM key_results kr
      JOIN objectives o ON kr.objective_id = o.id
      WHERE kr.id = $1 AND o.user_id = $2
    `

    const keyResultResult = await pool.query(keyResultQuery, [id, userId])

    if (keyResultResult.rows.length === 0) {
      throw createValidationError('关键结果不存在或无权限访问')
    }

    const keyResult = keyResultResult.rows[0]

    // 获取关联的任务
    const tasksQuery = `
      SELECT 
        t.id, t.title, t.description, t.status, t.priority,
        t.due_date, t.completed_at, t.created_at, t.updated_at
      FROM tasks t
      WHERE t.key_result_id = $1
      ORDER BY t.created_at DESC
    `

    const tasksResult = await pool.query(tasksQuery, [id])

    const responseData: KeyResultDetailResponse = {
      id: keyResult.id,
      title: keyResult.title,
      description: keyResult.description,
      type: keyResult.type,
      targetValue: parseFloat(keyResult.target_value),
      currentValue: parseFloat(keyResult.current_value),
      unit: keyResult.unit,
      progress: parseFloat(keyResult.progress),
      status: keyResult.status,
      objectiveId: keyResult.objective_id,
      createdAt: keyResult.created_at,
      updatedAt: keyResult.updated_at,
      objective: {
        id: keyResult.objective_id,
        title: keyResult.objective_title,
        category: keyResult.objective_category,
        status: keyResult.objective_status
      },
      tasks: tasksResult.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }))
    }

    res.json(this.buildSuccessResponse({ keyResult: responseData }))
  }

  // 创建新关键结果
  static async createKeyResult(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const createDto: CreateKeyResultDto = req.body

    // 验证输入数据
    ValidationService.validateKeyResultCreation(createDto)

    // 验证目标所有权
    await this.validateOwnership('objectives', createDto.objectiveId, userId, '目标')

    const result = await this.executeTransaction(async (client) => {
      // 创建关键结果
      const keyResultResult = await client.query(`
        INSERT INTO key_results (
          title, description, type, target_value, unit, objective_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, type, target_value, current_value,
                  unit, progress, status, objective_id, created_at
      `, [
        createDto.title,
        createDto.description,
        createDto.type,
        createDto.targetValue,
        createDto.unit,
        createDto.objectiveId
      ])

      return keyResultResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('create', '关键结果', result.id, userId)

    const responseData = {
      keyResult: {
        id: result.id,
        title: result.title,
        description: result.description,
        type: result.type,
        targetValue: parseFloat(result.target_value),
        currentValue: parseFloat(result.current_value),
        unit: result.unit,
        progress: parseFloat(result.progress),
        status: result.status,
        objectiveId: result.objective_id,
        createdAt: result.created_at
      }
    }

    res.status(201).json(this.buildSuccessResponse(responseData, '关键结果创建成功'))
  }

  // 更新关键结果
  static async updateKeyResult(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const updateDto: UpdateKeyResultDto = req.body

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的关键结果ID')
    }

    // 验证关键结果所有权
    await this.validateOwnership('key_results', id, userId, '关键结果')

    // 验证更新数据
    if (updateDto.status && !ValidationService.validateKeyResultStatus(updateDto.status)) {
      throw createValidationError('无效的关键结果状态')
    }

    const result = await this.executeTransaction(async (client) => {
      // 计算进度
      let progressUpdate = ''
      if (updateDto.currentValue !== undefined || updateDto.targetValue !== undefined) {
        // 需要重新计算进度
        const currentKR = await client.query('SELECT current_value, target_value, type FROM key_results WHERE id = $1', [id])
        const kr = currentKR.rows[0]
        
        const newCurrentValue = updateDto.currentValue !== undefined ? updateDto.currentValue : parseFloat(kr.current_value)
        const newTargetValue = updateDto.targetValue !== undefined ? updateDto.targetValue : parseFloat(kr.target_value)
        
        let newProgress = 0
        if (newTargetValue > 0) {
          if (kr.type === 'BOOLEAN') {
            newProgress = newCurrentValue >= 1 ? 100 : 0
          } else {
            newProgress = Math.min((newCurrentValue / newTargetValue) * 100, 100)
          }
        }
        
        progressUpdate = `, progress = ${newProgress}`
      }

      // 更新关键结果
      const updateResult = await client.query(`
        UPDATE key_results 
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          target_value = COALESCE($3, target_value),
          current_value = COALESCE($4, current_value),
          unit = COALESCE($5, unit),
          status = COALESCE($6, status),
          updated_at = CURRENT_TIMESTAMP
          ${progressUpdate}
        WHERE id = $7
        RETURNING id, title, description, type, target_value, current_value,
                  unit, progress, status, updated_at
      `, [
        updateDto.title,
        updateDto.description,
        updateDto.targetValue,
        updateDto.currentValue,
        updateDto.unit,
        updateDto.status,
        id
      ])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '关键结果', id, userId)

    const responseData = {
      keyResult: {
        id: result.id,
        title: result.title,
        description: result.description,
        type: result.type,
        targetValue: parseFloat(result.target_value),
        currentValue: parseFloat(result.current_value),
        unit: result.unit,
        progress: parseFloat(result.progress),
        status: result.status,
        updatedAt: result.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '关键结果更新成功'))
  }

  // 更新关键结果进度
  static async updateKeyResultProgress(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const { currentValue }: UpdateKeyResultProgressDto = req.body

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的关键结果ID')
    }

    if (typeof currentValue !== 'number' || currentValue < 0) {
      throw createValidationError('当前值必须是非负数')
    }

    // 验证关键结果所有权
    await this.validateOwnership('key_results', id, userId, '关键结果')

    const result = await this.executeTransaction(async (client) => {
      // 获取关键结果信息用于计算进度
      const keyResultInfo = await client.query(
        'SELECT target_value, type FROM key_results WHERE id = $1',
        [id]
      )

      if (keyResultInfo.rows.length === 0) {
        throw createValidationError('关键结果不存在')
      }

      const { target_value: targetValue, type } = keyResultInfo.rows[0]
      
      // 计算进度
      let progress = 0
      let status = 'IN_PROGRESS'
      
      if (targetValue > 0) {
        if (type === 'BOOLEAN') {
          progress = currentValue >= 1 ? 100 : 0
        } else {
          progress = Math.min((currentValue / parseFloat(targetValue)) * 100, 100)
        }
      }
      
      // 根据进度更新状态
      if (progress >= 100) {
        status = 'COMPLETED'
      } else if (progress > 0) {
        status = 'IN_PROGRESS'
      } else {
        status = 'NOT_STARTED'
      }

      // 更新关键结果
      const updateResult = await client.query(`
        UPDATE key_results 
        SET 
          current_value = $1,
          progress = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, current_value, progress, status, updated_at
      `, [currentValue, progress, status, id])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '关键结果进度', id, userId)

    const responseData = {
      keyResult: {
        id: result.id,
        currentValue: parseFloat(result.current_value),
        progress: parseFloat(result.progress),
        status: result.status,
        updatedAt: result.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '关键结果进度更新成功'))
  }

  // 删除关键结果
  static async deleteKeyResult(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的关键结果ID')
    }

    // 验证关键结果所有权
    await this.validateOwnership('key_results', id, userId, '关键结果')

    await this.executeTransaction(async (client) => {
      // 解除相关任务的关联
      await client.query(
        'UPDATE tasks SET key_result_id = NULL WHERE key_result_id = $1',
        [id]
      )
      
      // 删除关键结果
      await client.query('DELETE FROM key_results WHERE id = $1', [id])
    })

    // 记录操作日志
    this.logOperation('delete', '关键结果', id, userId)

    res.json(this.buildSuccessResponse(null, '关键结果删除成功'))
  }
} 