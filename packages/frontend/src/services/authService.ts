import { get, post, put } from './api'
import { API_ROUTES } from '@shared/constants'

// 认证相关类型
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Token管理
const AUTH_TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'currentUser'

export const AuthService = {
  // 登录
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await post<AuthResponse>(API_ROUTES.AUTH.LOGIN, credentials)
    
    // 保存认证信息
    this.setAuthData(response)
    
    return response
  },

  // 注册
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await post<AuthResponse>(API_ROUTES.AUTH.REGISTER, data)
    
    // 保存认证信息
    this.setAuthData(response)
    
    return response
  },

  // 退出登录
  async logout(): Promise<void> {
    try {
      // 通知服务器退出登录
      await post(API_ROUTES.AUTH.LOGOUT)
    } catch (error) {
      // 即使服务器请求失败，也要清除本地存储
      console.error('退出登录请求失败:', error)
    } finally {
      this.clearAuthData()
    }
  },

  // 刷新令牌
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('没有刷新令牌')
    }

    const response = await post<AuthResponse>(API_ROUTES.AUTH.REFRESH, { refreshToken })
    
    // 更新认证信息
    this.setAuthData(response)
    
    return response
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<User> {
    return await get<User>('/auth/me')
  },

  // 更新用户资料
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await put<User>(API_ROUTES.AUTH.PROFILE, data)
    
    // 更新本地用户信息
    this.setUser(response)
    
    return response
  },

  // 修改密码
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await put('/auth/change-password', data)
  },

  // 请求密码重置
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await post('/auth/forgot-password', data)
  },

  // 确认密码重置
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await post('/auth/reset-password', data)
  },

  // 验证邮箱
  async verifyEmail(token: string): Promise<void> {
    await post('/auth/verify-email', { token })
  },

  // 重新发送验证邮件
  async resendVerificationEmail(): Promise<void> {
    await post('/auth/resend-verification')
  },

  // Token管理方法
  setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_KEY, authResponse.token)
    localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user))
  },

  clearAuthData(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  // 检查token是否即将过期（提前5分钟刷新）
  isTokenExpiringSoon(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      // 解析JWT token（简单实现，实际生产环境可能需要更复杂的解析）
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      const timeUntilExpiry = payload.exp - currentTime
      
      // 如果剩余时间少于5分钟，认为即将过期
      return timeUntilExpiry < 300
    } catch (error) {
      console.error('解析token失败:', error)
      return true // 解析失败时认为需要刷新
    }
  }
}

// 导出单个方法以便使用
export const {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  isAuthenticated,
  getUser,
  getToken
} = AuthService 