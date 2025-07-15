import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, Priority as TaskPriority } from '@shared/types'
import { get, post, put, del, buildQueryString } from './api'

// 任务查询参数
export interface TaskListParams {
  page?: number
  limit?: number
  objectiveId?: string
  keyResultId?: string
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 补充缺失的类型定义
export interface CreateTaskData extends CreateTaskDto {}

export interface UpdateTaskData extends UpdateTaskDto {}

export interface BulkUpdateData {
  taskIds: string[]
  updates: Partial<UpdateTaskData>
}

export interface TaskDependencyUpdate {
  dependencies: string[]
  blockedBy?: string[]
}

export interface TaskQueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  assigneeId?: string
  filters?: {
    status?: TaskStatus[]
    priority?: TaskPriority[]
    dateRange?: {
      start: string
      end: string
    }
  }
}

export interface TaskListResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 任务服务类
export class TaskService {
  // 获取任务列表
  static async getTasks(params: TaskListParams = {}): Promise<any> {
    const queryString = buildQueryString(params)
    return await get(`/tasks${queryString}`)
  }

  // 获取单个任务详情
  async getTask(id: string): Promise<Task> {
    return await get<Task>(`/tasks/${id}`)
  }

  // 创建新任务
  async createTask(data: CreateTaskData): Promise<Task> {
    return await post<Task>('/tasks', data)
  }

  // 更新任务
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    return await put<Task>(`/tasks/${id}`, data)
  }

  // 删除任务
  async deleteTask(id: string): Promise<void> {
    await del(`/tasks/${id}`)
  }

  // 批量更新任务
  async bulkUpdateTasks(data: BulkUpdateData): Promise<Task[]> {
    return await put<Task[]>('/tasks/bulk', data)
  }

  // 批量删除任务
  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    await post('/tasks/bulk-delete', { taskIds })
  }

  // 更新任务状态
  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    return await put<Task>(`/tasks/${id}/status`, { status })
  }

  // 更新任务优先级
  async updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
    return await put<Task>(`/tasks/${id}/priority`, { priority })
  }

  // 更新任务依赖关系
  async updateTaskDependencies(id: string, data: TaskDependencyUpdate): Promise<Task> {
    return await put<Task>(`/tasks/${id}/dependencies`, data)
  }

  // 记录任务工时
  async logTaskTime(id: string, hours: number, description?: string): Promise<Task> {
    return await post<Task>(`/tasks/${id}/time-log`, { hours, description })
  }

  // 获取任务的时间记录
  async getTaskTimeLogs(id: string): Promise<any[]> {
    return await get<any[]>(`/tasks/${id}/time-logs`)
  }

  // 获取我的任务
  async getMyTasks(params: Omit<TaskQueryParams, 'assigneeId'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/tasks/my${queryString}`)
  }

  // 获取按目标分组的任务
  async getTasksByObjective(objectiveId: string, params: Omit<TaskQueryParams, 'filters'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/objectives/${objectiveId}/tasks${queryString}`)
  }

  // 获取按关键结果分组的任务
  async getTasksByKeyResult(keyResultId: string, params: Omit<TaskQueryParams, 'filters'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/key-results/${keyResultId}/tasks${queryString}`)
  }

  // 获取逾期任务
  async getOverdueTasks(params: Omit<TaskQueryParams, 'filters'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/tasks/overdue${queryString}`)
  }

  // 获取今天到期的任务
  async getTodayTasks(params: Omit<TaskQueryParams, 'filters'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/tasks/due-today${queryString}`)
  }

  // 获取本周到期的任务
  async getThisWeekTasks(params: Omit<TaskQueryParams, 'filters'> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(params)
    return await get<TaskListResponse>(`/tasks/due-this-week${queryString}`)
  }

  // 复制任务
  async duplicateTask(id: string, updates?: Partial<CreateTaskData>): Promise<Task> {
    return await post<Task>(`/tasks/${id}/duplicate`, updates || {})
  }

  // 获取任务统计信息
  async getTaskStatistics(): Promise<any> {
    return await get<any>('/tasks/statistics')
  }

  // 搜索任务
  async searchTasks(query: string, params: Omit<TaskQueryParams, 'search'> = {}): Promise<TaskListResponse> {
    const searchParams = { ...params, search: query }
    const queryString = buildQueryString(searchParams)
    return await get<TaskListResponse>(`/tasks/search${queryString}`)
  }

  // 获取所有可用标签
  async getAvailableTags(): Promise<string[]> {
    return await get<string[]>('/tasks/tags')
  }

  // 导出任务数据
  async exportTasks(params: TaskQueryParams = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const queryString = buildQueryString({ ...params, format })
    const response = await fetch(`/api/tasks/export${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('导出失败')
    }
    
    return await response.blob()
  }
}

// 创建服务实例
const taskService = new TaskService()

// 导出服务实例和静态方法
export const { getTasks } = TaskService

export const {
  getTask,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskDependencies,
  logTaskTime,
  getTaskTimeLogs,
  getMyTasks,
  getTasksByObjective,
  getTasksByKeyResult,
  getOverdueTasks,
  getTodayTasks,
  getThisWeekTasks,
  duplicateTask,
  getTaskStatistics,
  searchTasks,
  getAvailableTags,
  exportTasks
} = taskService

// 默认导出服务实例
export default taskService 
