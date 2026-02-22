import {
  Objective,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  PaginatedResponse,
  ObjectiveStatus,
  Priority
} from '@shared/types'
import { get, post, put, del, buildQueryString } from './api'

// 目标列表查询参数
export interface ObjectiveListParams {
  page?: number
  limit?: number
  search?: string
  systemId?: string
  status?: string
  priority?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 目标服务类
export class ObjectiveService {
  // 获取目标列表
  static async getObjectives(params: ObjectiveListParams = {}): Promise<PaginatedResponse<Objective>> {
    const queryString = buildQueryString(params)
    const response = await get<any>(`/objectives${queryString}`)

    if (!response) {
      throw new Error('API响应为空')
    }

    if (!response.objectives) {
      throw new Error('API响应格式错误：缺少objectives字段')
    }

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
    if (data.title.trim().length < 3) {
      throw new Error('目标标题不能少于3个字符');
    }
    
    const requestData = {
      title: data.title.trim(),
      description: data.description,
      systemId: data.systemId,
      priority: data.priority,
      startDate: data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : data.startDate,
      endDate: data.targetDate instanceof Date ? data.targetDate.toISOString().split('T')[0] : data.targetDate || null
    }

    const response = await post<any>('/objectives', requestData)
    return ObjectiveService.mapObjectiveFromBackend(response.objective)
  }

  // 更新目标
  static async updateObjective(id: string, data: UpdateObjectiveDto): Promise<Objective> {
    const requestData = {
      title: data.title,
      description: data.description,
      systemId: data.systemId,
      status: data.status,
      startDate: data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : data.startDate,
      endDate: data.targetDate instanceof Date ? data.targetDate.toISOString().split('T')[0] : data.targetDate,
      priority: data.priority || undefined
    }

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

  // 映射后端目标数据到前端格式
  private static mapObjectiveFromBackend(backendObj: any): Objective {
    return {
      id: backendObj.id,
      title: backendObj.title,
      description: backendObj.description,
      systemId: backendObj.systemId || '',
      systemName: backendObj.systemName,
      systemIcon: backendObj.systemIcon,
      systemColor: backendObj.systemColor,
      priority: backendObj.priority || Priority.MEDIUM,
      status: backendObj.status as ObjectiveStatus,
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
