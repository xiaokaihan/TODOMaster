// 关键结果实体接口
export interface KeyResult {
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
  createdAt: Date | string
  updatedAt: Date | string
}

// 关键结果类型枚举
export enum KeyResultType {
  NUMERIC = 'NUMERIC',
  PERCENTAGE = 'PERCENTAGE',
  BOOLEAN = 'BOOLEAN'
}

// 关键结果状态枚举
export enum KeyResultStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

// 关键结果详情（包含相关任务）
export interface KeyResultDetail extends KeyResult {
  tasks: TaskInfo[]
  objectiveTitle?: string
}

// 任务信息（用于关键结果详情）
export interface TaskInfo {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date | string
  completedAt?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
} 