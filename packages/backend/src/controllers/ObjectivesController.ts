import { Request, Response } from 'express'
import { CreateObjectiveDto, UpdateObjectiveDto, ObjectiveListQuery } from '../models/dto/ObjectiveDto'
import { Objective } from '../models/entities/Objective'
import { BaseController } from './BaseController'
import { ValidationService } from '../services/ValidationService'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'

export class ObjectivesController extends BaseController {
  // 格式化日期为 YYYY-MM-DD 格式
  private static formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 获取目标列表
  static async getObjectives(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const query: ObjectiveListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string || '',
      category: req.query.category as string || '',
      status: req.query.status as string || ''
    }

    const { page, limit } = this.validatePagination(
      query.page.toString(), 
      query.limit.toString()
    )
    const offset = (page - 1) * limit

    // 构建查询条件
    let baseConditions = ['user_id = $1']
    let queryParams: any[] = [userId]
    let paramIndex = 2

    // 搜索条件
    if (query.search) {
      baseConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      queryParams.push(`%${query.search}%`)
      paramIndex++
    }

    // 分类筛选
    if (query.category) {
      baseConditions.push(`category = $${paramIndex}`)
      queryParams.push(query.category)
      paramIndex++
    }

    // 状态筛选
    if (query.status) {
      baseConditions.push(`status = $${paramIndex}`)
      queryParams.push(query.status)
      paramIndex++
    }

    const whereClause = `WHERE ${baseConditions.join(' AND ')}`

    // 获取总数
    const total = await this.getTotalCount('objectives', whereClause, queryParams)

    // 获取目标列表
    const objectivesQuery = `
      SELECT 
        id, title, description, category, status, progress, 
        start_date, end_date, created_at, updated_at
      FROM objectives 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const objectivesResult = await pool.query(objectivesQuery, [...queryParams, limit, offset])

    const objectives: Objective[] = objectivesResult.rows.map(obj => ({
      id: obj.id,
      title: obj.title,
      description: obj.description,
      category: obj.category,
      status: obj.status,
      progress: parseFloat(obj.progress),
      startDate: this.formatDate(obj.start_date),
      endDate: this.formatDate(obj.end_date),
      userId: userId,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at
    }))

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    res.json(this.buildPaginatedResponse(objectives, pagination, 'objectives'))
  }

  // 获取单个目标详情
  static async getObjectiveById(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的目标ID')
    }

    // 获取目标详情（包含关键结果和任务）
    const objectiveQuery = `
      SELECT 
        o.id, o.title, o.description, o.category, o.status, o.progress, 
        o.start_date, o.end_date, o.created_at, o.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', kr.id,
              'title', kr.title,
              'description', kr.description,
              'type', kr.type,
              'targetValue', kr.target_value,
              'currentValue', kr.current_value,
              'unit', kr.unit,
              'progress', kr.progress,
              'status', kr.status,
              'createdAt', kr.created_at,
              'updatedAt', kr.updated_at
            )
          ) FILTER (WHERE kr.id IS NOT NULL), '[]'
        ) as key_results,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', t.id,
              'title', t.title,
              'description', t.description,
              'status', t.status,
              'priority', t.priority,
              'dueDate', t.due_date,
              'completedAt', t.completed_at,
              'keyResultId', t.key_result_id,
              'createdAt', t.created_at,
              'updatedAt', t.updated_at
            )
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tasks
      FROM objectives o
      LEFT JOIN key_results kr ON o.id = kr.objective_id
      LEFT JOIN tasks t ON o.id = t.objective_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id, o.title, o.description, o.category, o.status, o.progress,
               o.start_date, o.end_date, o.created_at, o.updated_at
    `

    const result = await pool.query(objectiveQuery, [id, userId])

    if (result.rows.length === 0) {
      throw createValidationError('目标不存在或无权限访问')
    }

    const objective = result.rows[0]

    const responseData = {
      objective: {
        id: objective.id,
        title: objective.title,
        description: objective.description,
        category: objective.category,
        status: objective.status,
        progress: parseFloat(objective.progress),
        startDate: this.formatDate(objective.start_date),
        endDate: this.formatDate(objective.end_date),
        keyResults: objective.key_results,
        tasks: objective.tasks,
        createdAt: objective.created_at,
        updatedAt: objective.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData))
  }

  // 创建新目标
  static async createObjective(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const createDto: CreateObjectiveDto = req.body

    // 验证输入数据
    ValidationService.validateObjectiveCreation(createDto)

    const result = await this.executeTransaction(async (client) => {
      // 创建目标
      const objectiveResult = await client.query(`
        INSERT INTO objectives (user_id, title, description, category, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, category, status, progress, start_date, end_date, created_at
      `, [userId, createDto.title, createDto.description, createDto.category, createDto.startDate || null, createDto.endDate || null])

      return objectiveResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('create', '目标', result.id, userId)

    const responseData = {
      objective: {
        id: result.id,
        title: result.title,
        description: result.description,
        category: result.category,
        status: result.status,
        progress: parseFloat(result.progress),
        startDate: this.formatDate(result.start_date),
        endDate: this.formatDate(result.end_date),
        createdAt: result.created_at
      }
    }

    res.status(201).json(this.buildSuccessResponse(responseData, '目标创建成功'))
  }

  // 更新目标
  static async updateObjective(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const updateDto: UpdateObjectiveDto = req.body

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的目标ID')
    }

    // 验证目标所有权
    await this.validateOwnership('objectives', id, userId, '目标')

    // 验证更新数据
    if (updateDto.category && !ValidationService.validateObjectiveCategory(updateDto.category)) {
      throw createValidationError('无效的目标分类')
    }

    if (updateDto.status && !ValidationService.validateObjectiveStatus(updateDto.status)) {
      throw createValidationError('无效的目标状态')
    }

    if (updateDto.startDate && updateDto.endDate && !ValidationService.validateDateRange(updateDto.startDate, updateDto.endDate)) {
      throw createValidationError('开始日期必须早于结束日期')
    }

    const result = await this.executeTransaction(async (client) => {
      // 更新目标
      const updateResult = await client.query(`
        UPDATE objectives 
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          status = COALESCE($4, status),
          start_date = COALESCE($5, start_date),
          end_date = COALESCE($6, end_date),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND user_id = $8
        RETURNING id, title, description, category, status, progress, start_date, end_date, updated_at
      `, [updateDto.title, updateDto.description, updateDto.category, updateDto.status, updateDto.startDate, updateDto.endDate, id, userId])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '目标', id, userId)

    const responseData = {
      objective: {
        id: result.id,
        title: result.title,
        description: result.description,
        category: result.category,
        status: result.status,
        progress: parseFloat(result.progress),
        startDate: this.formatDate(result.start_date),
        endDate: this.formatDate(result.end_date),
        updatedAt: result.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '目标更新成功'))
  }

  // 删除目标
  static async deleteObjective(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的目标ID')
    }

    // 验证目标所有权
    await this.validateOwnership('objectives', id, userId, '目标')

    await this.executeTransaction(async (client) => {
      // 删除目标（级联删除关键结果和任务）
      await client.query('DELETE FROM objectives WHERE id = $1 AND user_id = $2', [id, userId])
    })

    // 记录操作日志
    this.logOperation('delete', '目标', id, userId)

    res.json(this.buildSuccessResponse(null, '目标删除成功'))
  }
} 