import {
  Objective,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  PaginatedResponse,
  ObjectiveCategory,
  ObjectiveStatus,
  Priority
} from '@shared/types'
import { get, post, put, del, buildQueryString } from './api'

// 目标列表查询参数
export interface ObjectiveListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  priority?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 目标服务类
export class ObjectiveService {
  // 获取目标列表
  /**
   * 获取目标列表
   * @param params - 查询参数，包含分页、搜索、过滤和排序条件
   * @returns 包含目标列表和分页信息的响应对象
   * @example
   * // 获取第一页的目标列表，每页20条
   * const result = await ObjectiveService.getObjectives({ page: 1, limit: 20 });
   * // 搜索特定目标
   * const searchResult = await ObjectiveService.getObjectives({ search: "重要目标" });
   */
  static async getObjectives(params: ObjectiveListParams = {}): Promise<PaginatedResponse<Objective>> {
    const queryString = buildQueryString(params)
    const response = await get<any>(`/objectives${queryString}`)

    console.log('API Response:', response)

    // 检查响应结构
    if (!response) {
      throw new Error('API响应为空')
    }

    if (!response.objectives) {
      throw new Error('API响应格式错误：缺少objectives字段')
    }

    // apiRequest 已经返回了 data.data，所以 response 直接是 { objectives: [...], pagination: {...} }
    return {
      data: response.objectives.map((obj: any) => ObjectiveService.mapObjectiveFromBackend(obj)),
      pagination: response.pagination
    }
  }

  // 获取单个目标详情
  static async getObjective(id: string): Promise<Objective> {
    const response = await get<any>(`/objectives/${id}`)
    return ObjectiveService.mapObjectiveFromBackend(response.objective)
  }

  // 创建目标
  static async createObjective(data: CreateObjectiveDto): Promise<Objective> {
    // 确保标题符合数据库约束
    if (data.title.trim().length < 3) {
      throw new Error('目标标题不能少于3个字符');
    }
    
    // 转换数据格式以匹配后端期望
    const requestData = {
      title: data.title.trim(),
      description: data.description,
      category: ObjectiveService.mapCategoryToBackend(data.category),
      priority: data.priority,
      startDate: data.startDate.toISOString().split('T')[0],
      endDate: data.targetDate?.toISOString().split('T')[0] || null
    }

    const response = await post<any>('/objectives', requestData)
    return ObjectiveService.mapObjectiveFromBackend(response.objective)
  }

  // 更新目标
  static async updateObjective(id: string, data: UpdateObjectiveDto): Promise<Objective> {
    // 转换数据格式以匹配后端期望
    const requestData = {
      title: data.title,
      description: data.description,
      category: data.category ? ObjectiveService.mapCategoryToBackend(data.category) : undefined,
      status: data.status ? ObjectiveService.mapStatusToBackend(data.status) : undefined,
      startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : undefined,
      endDate: data.targetDate ? data.targetDate.toISOString().split('T')[0] : undefined,
      priority: data.priority || undefined
    }

    // 移除所有 undefined 的字段
    const cleanRequestData = Object.fromEntries(
      Object.entries(requestData).filter(([_, value]) => value !== undefined)
    )

    const response = await put<any>(`/objectives/${id}`, cleanRequestData)
    return ObjectiveService.mapObjectiveFromBackend(response.objective)
  }

  // 删除目标
  static async deleteObjective(id: string): Promise<void> {
    await del(`/objectives/${id}`)
  }

  // 映射前端分类到后端格式
  private static mapCategoryToBackend(category: ObjectiveCategory): string {
    return category.toUpperCase()
  }

  // 映射后端分类到前端格式
  private static mapCategoryFromBackend(category: string): ObjectiveCategory {
    return category as ObjectiveCategory
  }

  // 映射前端状态到后端格式
  private static mapStatusToBackend(status: ObjectiveStatus): string {
    return status.toUpperCase()
  }

  // 映射后端状态到前端格式
  private static mapStatusFromBackend(status: string): ObjectiveStatus {
    return status as ObjectiveStatus
  }

  // 映射后端目标数据到前端格式
  private static mapObjectiveFromBackend(backendObj: any): Objective {
    return {
      id: backendObj.id,
      title: backendObj.title,
      description: backendObj.description,
      category: ObjectiveService.mapCategoryFromBackend(backendObj.category),
      priority: backendObj.priority || Priority.MEDIUM,
      status: ObjectiveService.mapStatusFromBackend(backendObj.status),
      startDate: backendObj.startDate ? new Date(backendObj.startDate) : undefined,
      targetDate: backendObj.endDate ? new Date(backendObj.endDate) : undefined,
      completedAt: backendObj.completedAt ? new Date(backendObj.completedAt) : undefined,
      userId: backendObj.userId || '',
      createdAt: new Date(backendObj.createdAt),
      updatedAt: new Date(backendObj.updatedAt),
      progress: backendObj.progress || 0,
      tasks: backendObj.tasks || [],
      keyResults: backendObj.keyResults || []
    }
  }
}

// 导出便捷函数
export const {
  getObjectives,
  getObjective,
  createObjective,
  updateObjective,
  deleteObjective
} = ObjectiveService 
