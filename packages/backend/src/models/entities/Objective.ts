// 目标实体接口
export interface Objective {
  id: string
  title: string
  description?: string
  systemId: string
  systemName?: string
  systemIcon?: string
  status: ObjectiveStatus
  progress: number
  startDate?: string | null
  endDate?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

// 目标状态枚举
export enum ObjectiveStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// 目标详情（包含关联数据）
export interface ObjectiveDetail extends Objective {
  keyResults?: KeyResult[]
  tasks?: Task[]
}

// 关键结果实体（简化版，用于目标详情）
export interface KeyResult {
  id: string
  title: string
  description?: string
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN'
  targetValue: number
  currentValue: number
  unit?: string
  progress: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  objectiveId: string
  createdAt: Date | string
  updatedAt: Date | string
}

// 任务实体（简化版，用于目标详情）
export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date | string
  completedAt?: Date | string
  keyResultId?: string
  objectiveId: string
  createdAt: Date | string
  updatedAt: Date | string
}
