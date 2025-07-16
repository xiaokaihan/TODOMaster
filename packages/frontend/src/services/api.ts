// API基础配置
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

// 请求配置接口
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  skipAuth?: boolean
  skipRefresh?: boolean
  retries?: number
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 获取认证Token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken')
}

// 获取刷新Token
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

// 设置认证数据
const setAuthData = (token: string, refreshToken: string): void => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('refreshToken', refreshToken)
}

// 清除认证数据
const clearAuthData = (): void => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('currentUser')
}

// 检查token是否即将过期
const isTokenExpiringSoon = (): boolean => {
  const token = getAuthToken()
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    const timeUntilExpiry = payload.exp - currentTime
    
    // 如果剩余时间少于5分钟，认为即将过期
    return timeUntilExpiry < 300
  } catch (error) {
    console.error('解析token失败:', error)
    return true
  }
}

// 刷新认证令牌
const refreshAuthToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('刷新令牌失败')
    }

    const data = await response.json()
    setAuthData(data.token, data.refreshToken)
    return true
  } catch (error) {
    console.error('刷新令牌失败:', error)
    clearAuthData()
    // 可以在这里触发重新登录
    window.location.href = '/login'
    return false
  }
}

// 通用请求函数
export const apiRequest = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { method = 'GET', headers = {}, body, skipAuth = false, skipRefresh = false, retries = 1 } = config
  
  // 检查是否需要刷新token
  if (!skipAuth && !skipRefresh && isTokenExpiringSoon()) {
    await refreshAuthToken()
  }
  
  const url = `${API_BASE_URL}${endpoint}`
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }
  
  // 添加认证Token
  if (!skipAuth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }
  
  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include'
  }
  
  if (body && method !== 'GET') {
    requestConfig.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(url, requestConfig)
    
    // 处理401错误（未授权）
    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const refreshSuccess = await refreshAuthToken()
      if (refreshSuccess && retries > 0) {
        // 重新尝试请求
        return apiRequest<T>(endpoint, { ...config, retries: retries - 1, skipRefresh: true })
      } else {
        throw new ApiError('认证失败，请重新登录', 401)
      }
    }
    
    // 处理非JSON响应
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError(`服务器响应格式错误: ${response.status}`, response.status)
    }
    
    const data = await response.json()
    
    // 处理错误响应
    if (!response.ok) {
      // 检查是否是标准错误格式 { success: false, error: { message, ... } }
      const errorMessage = data.error?.message || data.message || `请求失败: ${response.status}`
      const errors = data.error?.errors || data.errors
      
      throw new ApiError(
        errorMessage,
        response.status,
        errors
      )
    }
    
    // 检查业务逻辑错误
    if (data.success === false) {
      const errorMessage = data.error?.message || data.message || '请求失败'
      const errors = data.error?.errors || data.errors
      
      throw new ApiError(
        errorMessage,
        response.status,
        errors
      )
    }
    
    return data.data || data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // 网络错误或其他异常
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('网络连接失败，请检查网络设置', 0)
    }
    
    throw new ApiError('请求过程中发生未知错误', 0)
  }
}

// GET请求
export const get = <T>(endpoint: string, headers?: Record<string, string>): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET', headers })
}

// POST请求
export const post = <T>(
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'POST', body, headers })
}

// PUT请求
export const put = <T>(
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'PUT', body, headers })
}

// DELETE请求
export const del = <T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE', body, headers })
}

// 构建查询参数
export const buildQueryString = (params: Record<string, any>): string => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => [key, String(v)])
      }
      return [[key, String(value)]]
    })
    .flat()
  
  if (filteredParams.length === 0) {
    return ''
  }
  
  const queryString = new URLSearchParams(filteredParams).toString()
  return `?${queryString}`
}

// 导出认证相关的工具函数
export {
  getAuthToken,
  getRefreshToken,
  setAuthData,
  clearAuthData,
  isTokenExpiringSoon,
  refreshAuthToken
} 