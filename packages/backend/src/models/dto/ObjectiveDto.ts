import { ObjectiveCategory, ObjectiveStatus } from '../entities/Objective'

// 创建目标的数据传输对象
export interface CreateObjectiveDto {
  title: string
  description?: string
  category: ObjectiveCategory
  startDate?: string
  endDate?: string
}

// 更新目标的数据传输对象
export interface UpdateObjectiveDto {
  title?: string
  description?: string
  category?: ObjectiveCategory
  status?: ObjectiveStatus
  startDate?: string
  endDate?: string
}

// 目标列表查询参数
export interface ObjectiveListQuery {
  page: number
  limit: number
  search: string
  category: string
  status: string
}

// 目标响应数据
export interface ObjectiveResponse {
  id: string
  title: string
  description?: string
  category: ObjectiveCategory
  status: ObjectiveStatus
  progress: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// 目标详情响应数据（包含关联数据）
export interface ObjectiveDetailResponse extends ObjectiveResponse {
  keyResults: KeyResultResponse[]
  tasks: TaskResponse[]
}

// 关键结果响应数据（用于目标详情）
export interface KeyResultResponse {
  id: string
  title: string
  description?: string
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN'
  targetValue: number
  currentValue: number
  unit?: string
  progress: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  createdAt: string
  updatedAt: string
}

// 任务响应数据（用于目标详情）
export interface TaskResponse {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  completedAt?: string
  keyResultId?: string
  createdAt: string
  updatedAt: string
}

// 分页信息
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 分页响应结构
export interface PaginatedResponse<T> {
  success: boolean
  data: {
    objectives?: T[]
    keyResults?: T[]
    tasks?: T[]
    users?: T[]
    pagination: PaginationInfo
  }
}

// API 标准响应结构
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
} 