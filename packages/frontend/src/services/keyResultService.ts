import { KeyResult, CreateKeyResultDto, UpdateKeyResultDto, KeyResultType, KeyResultStatus, PaginatedResponse } from '@shared/types'
import { get, post, put, del } from './api'

// 关键结果列表查询参数
export interface KeyResultListParams {
  search?: string
  objectiveId?: string
  status?: KeyResultStatus
  type?: KeyResultType
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 构建查询字符串的辅助函数
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// 关键结果服务类
export class KeyResultService {
  // 获取关键结果列表
  static async getKeyResults(params: KeyResultListParams = {}): Promise<PaginatedResponse<KeyResult>> {
    const queryString = buildQueryString(params)
    const response = await get<any>(`/key-results${queryString}`)

    console.log('KeyResult API Response:', response)

    // 检查响应结构
    if (!response) {
      throw new Error('API响应为空')
    }

    if (!response.keyResults) {
      throw new Error('API响应格式错误：缺少keyResults字段')
    }

    return {
      data: response.keyResults.map((kr: any) => KeyResultService.mapKeyResultFromBackend(kr)),
      pagination: response.pagination
    }
  }

  // 获取单个关键结果详情
  static async getKeyResult(id: string): Promise<KeyResult> {
    const response = await get<any>(`/key-results/${id}`)
    return KeyResultService.mapKeyResultFromBackend(response.keyResult)
  }

  // 创建关键结果
  static async createKeyResult(data: CreateKeyResultDto): Promise<KeyResult> {
    const requestData = {
      title: data.title,
      description: data.description,
      objectiveId: data.objectiveId,
      type: data.type,
      targetValue: data.targetValue,
      unit: data.unit,
      currentValue: data.currentValue || 0
    }

    const response = await post<any>('/key-results', requestData)
    return KeyResultService.mapKeyResultFromBackend(response.keyResult)
  }

  // 更新关键结果
  static async updateKeyResult(id: string, data: UpdateKeyResultDto): Promise<KeyResult> {
    const requestData = {
      title: data.title,
      description: data.description,
      type: data.type,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      unit: data.unit,
      status: data.status
    }

    const response = await put<any>(`/key-results/${id}`, requestData)
    return KeyResultService.mapKeyResultFromBackend(response.keyResult)
  }

  // 更新关键结果进度
  static async updateKeyResultProgress(id: string, currentValue: number): Promise<KeyResult> {
    const response = await put<any>(`/key-results/${id}`, {
      currentValue
    })
    return KeyResultService.mapKeyResultFromBackend(response.keyResult)
  }

  // 删除关键结果
  static async deleteKeyResult(id: string): Promise<void> {
    await del(`/key-results/${id}`)
  }

  // 映射后端关键结果数据到前端格式
  private static mapKeyResultFromBackend(backendKr: any): KeyResult {
    // 使用后端计算的进度值
    const progress = backendKr.progress || 0

    return {
      id: backendKr.id,
      title: backendKr.title,
      description: backendKr.description,
      type: backendKr.type as KeyResultType,
      targetValue: parseFloat(backendKr.targetValue),
      currentValue: parseFloat(backendKr.currentValue),
      unit: backendKr.unit,
      progress: Math.round(progress * 10) / 10, // 保留一位小数
      status: KeyResultService.mapStatusFromBackend(backendKr.status),
      dueDate: backendKr.dueDate ? new Date(backendKr.dueDate) : undefined,
      completedAt: backendKr.completedAt ? new Date(backendKr.completedAt) : undefined,
      objectiveId: backendKr.objectiveId,
      createdAt: new Date(backendKr.createdAt),
      updatedAt: new Date(backendKr.updatedAt)
    }
  }

  // 映射后端状态到前端格式
  private static mapStatusFromBackend(status: string): KeyResultStatus {
    const statusMap: Record<string, KeyResultStatus> = {
      'NOT_STARTED': KeyResultStatus.NOT_STARTED,
      'IN_PROGRESS': KeyResultStatus.IN_PROGRESS,
      'COMPLETED': KeyResultStatus.COMPLETED
    }
    return statusMap[status] || KeyResultStatus.NOT_STARTED
  }
}

// 导出便捷函数
export const {
  getKeyResults,
  getKeyResult,
  createKeyResult,
  updateKeyResult,
  updateKeyResultProgress,
  deleteKeyResult
} = KeyResultService 
