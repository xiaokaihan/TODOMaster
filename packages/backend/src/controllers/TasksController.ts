import { Request, Response } from 'express'
import { BaseController } from './BaseController'
import { ValidationService } from '../services/ValidationService'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskListQuery, 
  UpdateTaskStatusDto,
  TaskDependencyDto,
  TaskResponse,
  TaskDetailResponse
} from '../models/dto/TaskDto'
import { Task, TaskStatus, TaskPriority } from '../models/entities/Task'

export class TasksController extends BaseController {
  // 获取任务列表
  static async getTasks(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const query: TaskListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string || '',
      status: req.query.status as string || '',
      priority: req.query.priority as string || '',
      objectiveId: req.query.objectiveId as string || '',
      keyResultId: req.query.keyResultId as string || '',
      sortBy: req.query.sortBy as string || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
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
      baseConditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`)
      queryParams.push(`%${query.search}%`)
      paramIndex++
    }

    // 状态筛选
    if (query.status) {
      baseConditions.push(`t.status = $${paramIndex}`)
      queryParams.push(query.status)
      paramIndex++
    }

    // 优先级筛选
    if (query.priority) {
      baseConditions.push(`t.priority = $${paramIndex}`)
      queryParams.push(query.priority)
      paramIndex++
    }

    // 目标筛选
    if (query.objectiveId) {
      baseConditions.push(`t.objective_id = $${paramIndex}`)
      queryParams.push(query.objectiveId)
      paramIndex++
    }

    // 关键结果筛选
    if (query.keyResultId) {
      baseConditions.push(`t.key_result_id = $${paramIndex}`)
      queryParams.push(query.keyResultId)
      paramIndex++
    }

    const whereClause = `WHERE ${baseConditions.join(' AND ')}`

    // 验证排序字段
    const validSortFields = ['created_at', 'updated_at', 'title', 'priority', 'due_date', 'status']
    const sortField = validSortFields.includes(query.sortBy) ? query.sortBy : 'created_at'
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC'

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) 
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      ${whereClause}
    `
    const countResult = await pool.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].count)

    // 获取任务列表
    const tasksQuery = `
      SELECT 
        t.id, t.title, t.description, t.status, t.priority,
        t.estimated_hours, t.actual_hours, t.due_date, t.completed_at,
        t.objective_id, t.key_result_id, t.created_at, t.updated_at,
        o.title as objective_title,
        kr.title as key_result_title
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      LEFT JOIN key_results kr ON t.key_result_id = kr.id
      ${whereClause}
      ORDER BY t.${sortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const tasksResult = await pool.query(tasksQuery, [...queryParams, limit, offset])

    const tasks: TaskResponse[] = tasksResult.rows.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      dueDate: task.due_date,
      completedAt: task.completed_at,
      objectiveId: task.objective_id,
      keyResultId: task.key_result_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }))

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    res.json(this.buildPaginatedResponse(tasks, pagination, 'tasks'))
  }

  // 获取单个任务详情
  static async getTaskById(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的任务ID')
    }

    // 获取任务详情
    const taskQuery = `
      SELECT 
        t.*,
        o.title as objective_title,
        o.category as objective_category,
        kr.title as key_result_title,
        kr.type as key_result_type
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      LEFT JOIN key_results kr ON t.key_result_id = kr.id
      WHERE t.id = $1 AND o.user_id = $2
    `

    const taskResult = await pool.query(taskQuery, [id, userId])

    if (taskResult.rows.length === 0) {
      throw createValidationError('任务不存在或无权限访问')
    }

    const task = taskResult.rows[0]

    // 获取任务依赖关系
    const dependenciesQuery = `
      SELECT 
        td.id as dependency_id,
        t2.id,
        t2.title,
        t2.status,
        t2.completed_at
      FROM task_dependencies td
      JOIN tasks t2 ON td.depends_on_task_id = t2.id
      WHERE td.task_id = $1
    `

    const blocksQuery = `
      SELECT 
        td.id as dependency_id,
        t2.id,
        t2.title,
        t2.status,
        t2.completed_at
      FROM task_dependencies td
      JOIN tasks t2 ON td.task_id = t2.id
      WHERE td.depends_on_task_id = $1
    `

    const [dependenciesResult, blocksResult] = await Promise.all([
      pool.query(dependenciesQuery, [id]),
      pool.query(blocksQuery, [id])
    ])

    const responseData: TaskDetailResponse = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      dueDate: task.due_date,
      completedAt: task.completed_at,
      objectiveId: task.objective_id,
      keyResultId: task.key_result_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      objective: {
        id: task.objective_id,
        title: task.objective_title,
        category: task.objective_category
      },
      keyResult: task.key_result_id ? {
        id: task.key_result_id,
        title: task.key_result_title,
        type: task.key_result_type
      } : undefined,
      dependencies: dependenciesResult.rows.map(dep => ({
        id: dep.id,
        title: dep.title,
        status: dep.status,
        completedAt: dep.completed_at
      })),
      blocks: blocksResult.rows.map(block => ({
        id: block.id,
        title: block.title,
        status: block.status,
        completedAt: block.completed_at
      }))
    }

    res.json(this.buildSuccessResponse({ task: responseData }))
  }

  // 创建新任务
  static async createTask(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const createDto: CreateTaskDto = req.body

    // 验证输入数据
    ValidationService.validateTaskCreation(createDto)

    // 验证目标所有权
    await this.validateOwnership('objectives', createDto.objectiveId, userId, '目标')

    // 验证关键结果所有权（如果指定）
    if (createDto.keyResultId) {
      await this.validateOwnership('key_results', createDto.keyResultId, userId, '关键结果')
    }

    const result = await this.executeTransaction(async (client) => {
      // 创建任务
      const taskResult = await client.query(`
        INSERT INTO tasks (
          title, description, priority, estimated_hours, due_date, 
          objective_id, key_result_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, description, priority, status, estimated_hours, 
                  due_date, objective_id, key_result_id, created_at
      `, [
        createDto.title,
        createDto.description,
        createDto.priority,
        createDto.estimatedHours,
        createDto.dueDate || null,
        createDto.objectiveId,
        createDto.keyResultId || null
      ])

      return taskResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('create', '任务', result.id, userId)

    const responseData = {
      task: {
        id: result.id,
        title: result.title,
        description: result.description,
        priority: result.priority,
        status: result.status,
        estimatedHours: result.estimated_hours,
        dueDate: result.due_date,
        objectiveId: result.objective_id,
        keyResultId: result.key_result_id,
        createdAt: result.created_at
      }
    }

    res.status(201).json(this.buildSuccessResponse(responseData, '任务创建成功'))
  }

  // 更新任务
  static async updateTask(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const updateDto: UpdateTaskDto = req.body

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的任务ID')
    }

    // 验证任务所有权
    await this.validateOwnership('tasks', id, userId, '任务')

    // 验证更新数据
    if (updateDto.priority && !ValidationService.validateTaskPriority(updateDto.priority)) {
      throw createValidationError('无效的任务优先级')
    }

    if (updateDto.status && !ValidationService.validateTaskStatus(updateDto.status)) {
      throw createValidationError('无效的任务状态')
    }

    const result = await this.executeTransaction(async (client) => {
      // 更新任务
      const updateResult = await client.query(`
        UPDATE tasks 
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          priority = COALESCE($3, priority),
          status = COALESCE($4, status),
          estimated_hours = COALESCE($5, estimated_hours),
          actual_hours = COALESCE($6, actual_hours),
          due_date = COALESCE($7, due_date),
          key_result_id = CASE 
            WHEN $8::uuid IS NOT NULL THEN $8 
            ELSE key_result_id 
          END,
          completed_at = CASE 
            WHEN COALESCE($4, status) = 'COMPLETED' AND status != 'COMPLETED' 
              THEN CURRENT_TIMESTAMP
            WHEN COALESCE($4, status) != 'COMPLETED' AND status = 'COMPLETED' 
              THEN NULL
            ELSE completed_at
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING id, title, description, priority, status, estimated_hours, 
                  actual_hours, due_date, completed_at, key_result_id, updated_at
      `, [
        updateDto.title,
        updateDto.description,
        updateDto.priority,
        updateDto.status,
        updateDto.estimatedHours,
        updateDto.actualHours,
        updateDto.dueDate,
        updateDto.keyResultId,
        id
      ])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '任务', id, userId)

    const responseData = {
      task: {
        id: result.id,
        title: result.title,
        description: result.description,
        priority: result.priority,
        status: result.status,
        estimatedHours: result.estimated_hours,
        actualHours: result.actual_hours,
        dueDate: result.due_date,
        completedAt: result.completed_at,
        keyResultId: result.key_result_id,
        updatedAt: result.updated_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '任务更新成功'))
  }

  // 更新任务状态
  static async updateTaskStatus(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const { status }: UpdateTaskStatusDto = req.body

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的任务ID')
    }

    if (!ValidationService.validateTaskStatus(status)) {
      throw createValidationError('无效的任务状态')
    }

    // 验证任务所有权
    await this.validateOwnership('tasks', id, userId, '任务')

    const result = await this.executeTransaction(async (client) => {
      const updateResult = await client.query(`
        UPDATE tasks 
        SET 
          status = $1,
          completed_at = CASE 
            WHEN $1 = 'COMPLETED' AND status != 'COMPLETED' THEN CURRENT_TIMESTAMP
            WHEN $1 != 'COMPLETED' AND status = 'COMPLETED' THEN NULL
            ELSE completed_at
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, status, completed_at
      `, [status, id])

      return updateResult.rows[0]
    })

    // 记录操作日志
    this.logOperation('update', '任务状态', id, userId)

    const responseData = {
      task: {
        id: result.id,
        status: result.status,
        completedAt: result.completed_at
      }
    }

    res.json(this.buildSuccessResponse(responseData, '任务状态更新成功'))
  }

  // 删除任务
  static async deleteTask(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params

    if (!ValidationService.validateUUID(id)) {
      throw createValidationError('无效的任务ID')
    }

    // 验证任务所有权
    await this.validateOwnership('tasks', id, userId, '任务')

    await this.executeTransaction(async (client) => {
      // 删除任务依赖关系
      await client.query('DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1', [id])
      
      // 删除任务
      await client.query('DELETE FROM tasks WHERE id = $1', [id])
    })

    // 记录操作日志
    this.logOperation('delete', '任务', id, userId)

    res.json(this.buildSuccessResponse(null, '任务删除成功'))
  }

  // 添加任务依赖
  static async addTaskDependency(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id } = req.params
    const { dependsOnTaskId }: TaskDependencyDto = req.body

    if (!ValidationService.validateUUID(id) || !ValidationService.validateUUID(dependsOnTaskId)) {
      throw createValidationError('无效的任务ID')
    }

    if (id === dependsOnTaskId) {
      throw createValidationError('任务不能依赖自己')
    }

    // 验证两个任务的所有权
    await Promise.all([
      this.validateOwnership('tasks', id, userId, '任务'),
      this.validateOwnership('tasks', dependsOnTaskId, userId, '依赖任务')
    ])

    // 检查是否已存在依赖关系
    const existingDependency = await pool.query(
      'SELECT id FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2',
      [id, dependsOnTaskId]
    )

    if (existingDependency.rows.length > 0) {
      throw createValidationError('依赖关系已存在')
    }

    // 检查循环依赖
    const hasCyclicDependency = await this.checkCyclicDependency(id, dependsOnTaskId)
    if (hasCyclicDependency) {
      throw createValidationError('不能创建循环依赖')
    }

    await this.executeTransaction(async (client) => {
      await client.query(
        'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2)',
        [id, dependsOnTaskId]
      )
    })

    res.json(this.buildSuccessResponse(null, '任务依赖添加成功'))
  }

  // 移除任务依赖
  static async removeTaskDependency(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { id, dependencyId } = req.params

    if (!ValidationService.validateUUID(id) || !ValidationService.validateUUID(dependencyId)) {
      throw createValidationError('无效的任务ID')
    }

    // 验证任务所有权
    await this.validateOwnership('tasks', id, userId, '任务')

    await this.executeTransaction(async (client) => {
      const result = await client.query(
        'DELETE FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2',
        [id, dependencyId]
      )

      if (result.rowCount === 0) {
        throw createValidationError('依赖关系不存在')
      }
    })

    res.json(this.buildSuccessResponse(null, '任务依赖移除成功'))
  }

  // 检查循环依赖的私有方法
  private static async checkCyclicDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // 使用递归查询检查是否存在从 dependsOnTaskId 到 taskId 的路径
    const query = `
      WITH RECURSIVE dependency_path AS (
        SELECT task_id, depends_on_task_id, 1 as level
        FROM task_dependencies
        WHERE task_id = $1
        
        UNION ALL
        
        SELECT td.task_id, td.depends_on_task_id, dp.level + 1
        FROM task_dependencies td
        JOIN dependency_path dp ON td.task_id = dp.depends_on_task_id
        WHERE dp.level < 10  -- 防止无限递归
      )
      SELECT EXISTS(
        SELECT 1 FROM dependency_path WHERE depends_on_task_id = $2
      ) as has_cycle
    `

    const result = await pool.query(query, [dependsOnTaskId, taskId])
    return result.rows[0].has_cycle
  }
} 