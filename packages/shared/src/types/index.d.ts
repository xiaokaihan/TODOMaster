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
    progress?: number;
}
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    dueDate?: Date;
    completedAt?: Date;
    userId: string;
    objectiveId?: string;
    createdAt: Date;
    updatedAt: Date;
    duration?: number;
    tags?: string[];
}
export interface KeyResult {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    progress: number;
    targetValue?: number;
    currentValue?: number;
    startValue?: number;
    unit?: string;
    objectiveId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ObjectiveCategory {
    PERSONAL = "PERSONAL",// 个人发展
    PROFESSIONAL = "PROFESSIONAL",// 职业发展
    HEALTH = "HEALTH",// 健康生活
    LEARNING = "LEARNING",// 学习成长
    FINANCIAL = "FINANCIAL",// 财务规划
    RELATIONSHIP = "RELATIONSHIP",// 人际关系
    CREATIVE = "CREATIVE",// 创意项目
    OTHER = "OTHER"
}
export declare enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ObjectiveStatus {
    DRAFT = "DRAFT",// 草稿
    ACTIVE = "ACTIVE",// 进行中
    ON_HOLD = "ON_HOLD",// 暂停
    COMPLETED = "COMPLETED",// 已完成
    CANCELLED = "CANCELLED"
}
export declare enum TaskStatus {
    TODO = "TODO",// 待办
    IN_PROGRESS = "IN_PROGRESS",// 进行中
    COMPLETED = "COMPLETED",// 已完成
    CANCELLED = "CANCELLED"
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}
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
export interface CreateObjectiveDto {
    title: string;
    description?: string;
    category: ObjectiveCategory;
    priority: Priority;
    startDate?: Date;
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
    status?: TaskStatus;
    priority: Priority;
    dueDate?: Date;
    objectiveId?: string;
    duration?: number;
    tags?: string[];
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    objectiveId?: string;
    duration?: number;
    tags?: string[];
}
export interface CreateKeyResultDto {
    title: string;
    description?: string;
    targetValue?: number;
    startValue?: number;
    unit?: string;
    objectiveId: string;
}
export interface UpdateKeyResultDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    progress?: number;
    targetValue?: number;
    currentValue?: number;
    startValue?: number;
    unit?: string;
}
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
export interface UserStats {
    totalObjectives: number;
    activeObjectives: number;
    completedObjectives: number;
    totalTasks: number;
    completedTasks: number;
    averageTaskCompletionTime: number;
    productivityScore: number;
}
export interface TimelineItem {
    id: string;
    type: 'objective_created' | 'objective_completed' | 'task_created' | 'task_completed';
    title: string;
    description: string;
    timestamp: Date;
    relatedId: string;
}
//# sourceMappingURL=index.d.ts.map