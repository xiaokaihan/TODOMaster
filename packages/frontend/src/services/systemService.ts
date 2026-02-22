import {
  System,
  CreateSystemDto,
  UpdateSystemDto,
  SystemStatus
} from '@shared/types'
import { get, post, put, del } from './api'

// 系统列表查询参数
export interface SystemListParams {
  status?: SystemStatus
}

// 系统服务类
export class SystemService {
  // 获取系统列表
  static async getSystems(params: SystemListParams = {}): Promise<System[]> {
    const queryParts: string[] = []
    if (params.status) queryParts.push(`status=${params.status}`)
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''

    const response = await get<any>(`/systems${queryString}`)
    return (response.systems || []).map(SystemService.mapSystemFromBackend)
  }

  // 获取单个系统详情（含目标列表）
  static async getSystem(id: string): Promise<{ system: System; objectives: any[] }> {
    const response = await get<any>(`/systems/${id}`)
    return {
      system: SystemService.mapSystemFromBackend(response.system),
      objectives: response.objectives || []
    }
  }

  // 创建系统
  static async createSystem(data: CreateSystemDto): Promise<System> {
    const response = await post<any>('/systems', data)
    return SystemService.mapSystemFromBackend(response.system)
  }

  // 更新系统
  static async updateSystem(id: string, data: UpdateSystemDto): Promise<System> {
    const response = await put<any>(`/systems/${id}`, data)
    return SystemService.mapSystemFromBackend(response.system)
  }

  // 删除系统
  static async deleteSystem(id: string): Promise<void> {
    await del(`/systems/${id}`)
  }

  // 调整系统排序
  static async reorderSystems(orderedIds: string[]): Promise<void> {
    await put('/systems/reorder', { orderedIds })
  }

  // 映射后端数据到前端格式
  private static mapSystemFromBackend(data: any): System {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      status: data.status as SystemStatus,
      sortOrder: data.sortOrder ?? 0,
      userId: data.userId || '',
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      objectiveCount: data.objectiveCount ?? 0,
      activeObjectiveCount: data.activeObjectiveCount ?? 0,
      completedObjectiveCount: data.completedObjectiveCount ?? 0,
      overallProgress: data.overallProgress ?? 0
    }
  }
}

export const {
  getSystems,
  getSystem,
  createSystem,
  updateSystem,
  deleteSystem,
  reorderSystems
} = SystemService
