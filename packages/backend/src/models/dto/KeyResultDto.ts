import { KeyResultType, KeyResultStatus } from '../entities/KeyResult'

// 创建关键结果的数据传输对象
export interface CreateKeyResultDto {
  title: string
  description?: string
  type: KeyResultType
  targetValue: number
  unit?: string
  objectiveId: string
}

// 更新关键结果的数据传输对象
export interface UpdateKeyResultDto {
  title?: string
  description?: string
  targetValue?: number
  currentValue?: number
  unit?: string
  status?: KeyResultStatus
}

// 关键结果列表查询参数
export interface KeyResultListQuery {
  page: number
  limit: number
  search: string
  type: string
  status: string
  objectiveId: string
}

// 更新关键结果进度 DTO
export interface UpdateKeyResultProgressDto {
  currentValue: number
}

// 关键结果响应数据
export interface KeyResultResponse {
  id: string
  title: string
  description?: string
  type: KeyResultType
  targetValue: number
  currentValue: number
  unit?: string
  progress: number
  status: KeyResultStatus
  objectiveId: string
  createdAt: string
  updatedAt: string
}

// 关键结果详情响应数据（包含关联信息）
export interface KeyResultDetailResponse extends KeyResultResponse {
  objective: {
    id: string
    title: string
    category: string
    status: string
  }
  tasks: TaskInfo[]
}

// 任务信息（用于关键结果详情）
export interface TaskInfo {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
} 