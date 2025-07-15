import { TaskStatus, TaskPriority } from '../entities/Task'

// 创建任务的数据传输对象
export interface CreateTaskDto {
  title: string
  description?: string
  priority: TaskPriority
  estimatedHours?: number
  dueDate?: string
  objectiveId: string
  keyResultId?: string
}

// 更新任务的数据传输对象
export interface UpdateTaskDto {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
  keyResultId?: string
}

// 任务列表查询参数
export interface TaskListQuery {
  page: number
  limit: number
  search: string
  status: string
  priority: string
  objectiveId: string
  keyResultId: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// 任务状态更新 DTO
export interface UpdateTaskStatusDto {
  status: TaskStatus
}

// 任务依赖关系 DTO
export interface TaskDependencyDto {
  dependsOnTaskId: string
}

// 任务响应数据
export interface TaskResponse {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
  completedAt?: string
  objectiveId: string
  keyResultId?: string
  createdAt: string
  updatedAt: string
}

// 任务详情响应数据（包含关联信息）
export interface TaskDetailResponse extends TaskResponse {
  objective: {
    id: string
    title: string
    category: string
  }
  keyResult?: {
    id: string
    title: string
    type: string
  }
  dependencies: TaskDependencyInfo[]
  blocks: TaskDependencyInfo[]
}

// 任务依赖信息
export interface TaskDependencyInfo {
  id: string
  title: string
  status: TaskStatus
  completedAt?: string
} 