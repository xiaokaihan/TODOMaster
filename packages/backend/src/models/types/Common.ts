// 通用 API 响应结构
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// 分页信息
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 查询参数基础接口
export interface BaseQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 时间戳接口
export interface Timestamps {
  createdAt: Date | string
  updatedAt: Date | string
}

// 软删除接口
export interface SoftDelete {
  deletedAt?: Date | string
}

// 数据库实体基础接口
export interface BaseEntity extends Timestamps {
  id: string
}

// 用户相关的实体接口（包含用户ID）
export interface UserOwnedEntity extends BaseEntity {
  userId: string
}

// 操作日志类型
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'

// 实体类型
export type EntityType = 'USER' | 'OBJECTIVE' | 'KEY_RESULT' | 'TASK'

// 活动日志接口
export interface ActivityLog extends BaseEntity {
  userId: string
  entityType: EntityType
  entityId: string
  action: ActionType
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
} 