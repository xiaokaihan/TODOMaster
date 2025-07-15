// 用户实体接口
export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  role: UserRole
  avatarUrl?: string
  timezone?: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// 用户偏好设置
export interface UserPreferences {
  id: string
  userId: string
  key: string
  value: string
  createdAt: Date | string
  updatedAt: Date | string
}

// 用户统计信息
export interface UserStats {
  totalObjectives: number
  completedObjectives: number
  totalTasks: number
  completedTasks: number
}

// 用户详情（包含统计信息）
export interface UserDetail extends Omit<User, 'passwordHash'> {
  stats: UserStats
} 