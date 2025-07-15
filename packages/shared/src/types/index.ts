// 用户相关类型
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 目标相关类型
export interface Objective {
  id: string;
  title: string;
  description?: string;
  category: ObjectiveCategory;
  priority: Priority;
  status: ObjectiveStatus;
  startDate?: Date;
  targetDate?: Date;
  completedAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  keyResults?: KeyResult[];
  progress?: number; // 0-100，基于关联任务的完成情况
}

// 关键结果相关类型
export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  type: KeyResultType;
  targetValue: number;
  currentValue: number;
  unit?: string;
  progress: number; // 0-100
  status: KeyResultStatus;
  dueDate?: Date; // 截止日期
  completedAt?: Date; // 完成时间
  objectiveId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: Date;
  estimatedDuration?: number; // 预估时长（分钟）
  actualDuration?: number; // 实际时长（分钟）
  completedAt?: Date;
  objectiveId: string; // 必须关联到目标
  keyResultId?: string; // 可选关联到关键结果
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  dependencies?: string[]; // 依赖的其他任务ID
}

// 枚举类型
export enum ObjectiveCategory {
  PERSONAL = 'PERSONAL',        // 个人发展
  PROFESSIONAL = 'PROFESSIONAL', // 职业发展
  HEALTH = 'HEALTH',           // 健康生活
  LEARNING = 'LEARNING',       // 学习成长
  FINANCIAL = 'FINANCIAL',     // 财务规划
  RELATIONSHIP = 'RELATIONSHIP', // 人际关系
  CREATIVE = 'CREATIVE',       // 创意项目
  OTHER = 'OTHER'              // 其他
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ObjectiveStatus {
  DRAFT = 'DRAFT',         // 草稿
  ACTIVE = 'ACTIVE',       // 进行中
  ON_HOLD = 'ON_HOLD',     // 暂停
  COMPLETED = 'COMPLETED', // 已完成
  CANCELLED = 'CANCELLED'  // 已取消
}

export enum TaskStatus {
  TODO = 'TODO',           // 待办
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  WAITING = 'WAITING',     // 等待中（依赖其他任务）
  COMPLETED = 'COMPLETED', // 已完成
  CANCELLED = 'CANCELLED'  // 已取消
}

export enum KeyResultType {
  NUMERIC = 'NUMERIC',     // 数值型（如：完成5本书）
  PERCENTAGE = 'PERCENTAGE', // 百分比型（如：提升20%）
  BOOLEAN = 'BOOLEAN'      // 布尔型（如：是否完成）
}

export enum KeyResultStatus {
  NOT_STARTED = 'NOT_STARTED', // 未开始
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  COMPLETED = 'COMPLETED'      // 已完成
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 创建和更新的数据传输对象
export interface CreateObjectiveDto {
  title: string;
  description?: string;
  category: ObjectiveCategory;
  priority: Priority;
  startDate: Date;
  targetDate?: Date;
}

export interface UpdateObjectiveDto {
  title?: string;
  description?: string;
  category?: ObjectiveCategory;
  priority?: Priority;
  startDate?: Date;
  targetDate?: Date;
  status?: ObjectiveStatus;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: Date;
  estimatedDuration?: number;
  objectiveId: string; // 必须指定关联的目标
  keyResultId?: string; // 可选关联到关键结果
  tags?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  keyResultId?: string;
  tags?: string[];
  dependencies?: string[];
}

// 认证相关类型
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// 统计和分析相关类型
export interface UserStats {
  totalObjectives: number;
  activeObjectives: number;
  completedObjectives: number;
  totalTasks: number;
  completedTasks: number;
  averageTaskCompletionTime: number;
  productivityScore: number; // 0-100
}

export interface TimelineItem {
  id: string;
  type: 'objective_created' | 'objective_completed' | 'task_created' | 'task_completed';
  title: string;
  description: string;
  timestamp: Date;
  relatedId: string; // objective or task id
}

export interface CreateKeyResultDto {
  title: string;
  description?: string;
  type: KeyResultType;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  dueDate?: Date;
  objectiveId: string;
}

export interface UpdateKeyResultDto {
  title?: string;
  description?: string;
  type?: KeyResultType;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: Date;
  status?: KeyResultStatus;
}