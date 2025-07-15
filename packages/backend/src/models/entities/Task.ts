// 任务实体接口
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  estimatedHours?: number
  actualHours?: number
  dueDate?: Date | string
  completedAt?: Date | string
  keyResultId?: string
  objectiveId: string
  userId: string
  createdAt: Date | string
  updatedAt: Date | string
}

// 任务状态枚举
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// 任务依赖关系
export interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  createdAt: Date | string
}

// 任务详情（包含依赖关系）
export interface TaskDetail extends Task {
  dependencies: TaskDependencyInfo[]
  blocks: TaskDependencyInfo[]
  objectiveTitle?: string
  keyResultTitle?: string
}

// 任务依赖信息
export interface TaskDependencyInfo {
  id: string
  title: string
  status: TaskStatus
} 