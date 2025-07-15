import { User } from '@shared/types'
import { get, post, put, del, buildQueryString } from './api'

// 补充缺失的类型定义
export interface UpdateUserProfileDto {
  name?: string
  email?: string
  avatar?: string
  bio?: string
  department?: string
  position?: string
  skills?: string[]
  preferences?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: string
    notifications?: {
      email?: boolean
      push?: boolean
      desktop?: boolean
    }
    timezone?: string
  }
}

export interface UserSearchParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  department?: string
  status?: 'active' | 'inactive'
}

export interface UserListResponse {
  users: UserProfile[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserProfile extends User {
  preferences?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: string
    notifications?: {
      email?: boolean
      push?: boolean
      desktop?: boolean
    }
    timezone?: string
  }
}

export interface UserActivity {
  id: string
  type: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface UserStatistics {
  tasksCompleted: number
  objectivesAchieved: number
  totalHoursWorked: number
  averageTaskCompletion: number
  productivityScore: number
  recentActivity: UserActivity[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'manager' | 'member'
  department?: string
  position?: string
  joinedAt: string
  status: 'active' | 'inactive'
}

export interface InviteUserData {
  email: string
  role: TeamMember['role']
  message?: string
}

// 用户服务类
export class UserService {
  // 获取用户资料
  static async getUserProfile(): Promise<User> {
    const response = await get<{ user: User }>('/users/profile')
    return response.user
  }

  // 更新用户资料
  static async updateUserProfile(data: UpdateUserProfileDto): Promise<User> {
    const response = await put<{ user: User }>('/users/profile', data)
    return response.user
  }

  // 上传头像
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('头像上传失败')
    }
    
    return await response.json()
  }

  // 删除头像
  async deleteAvatar(): Promise<void> {
    await del('/users/avatar')
  }

  // 获取用户列表（管理员功能）
  async getUsers(params: UserSearchParams = {}): Promise<UserListResponse> {
    const queryString = buildQueryString(params)
    return await get<UserListResponse>(`/users${queryString}`)
  }

  // 获取单个用户信息
  async getUser(id: string): Promise<UserProfile> {
    return await get<UserProfile>(`/users/${id}`)
  }

  // 搜索用户
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    const queryString = buildQueryString({ search: query, limit })
    return await get<UserProfile[]>(`/users/search${queryString}`)
  }

  // 获取用户活动记录
  async getUserActivity(userId?: string, params: { page?: number; limit?: number } = {}): Promise<{
    activities: UserActivity[]
    pagination: any
  }> {
    const endpoint = userId ? `/users/${userId}/activity` : '/users/activity'
    const queryString = buildQueryString(params)
    return await get(`${endpoint}${queryString}`)
  }

  // 获取用户统计信息
  async getUserStatistics(userId?: string): Promise<UserStatistics> {
    const endpoint = userId ? `/users/${userId}/statistics` : '/users/statistics'
    return await get<UserStatistics>(endpoint)
  }

  // 获取用户的目标
  async getUserObjectives(userId?: string, params: { page?: number; limit?: number } = {}) {
    const endpoint = userId ? `/users/${userId}/objectives` : '/users/objectives'
    const queryString = buildQueryString(params)
    return await get(`${endpoint}${queryString}`)
  }

  // 获取用户的任务
  async getUserTasks(userId?: string, params: { page?: number; limit?: number } = {}) {
    const endpoint = userId ? `/users/${userId}/tasks` : '/users/tasks'
    const queryString = buildQueryString(params)
    return await get(`${endpoint}${queryString}`)
  }

  // 更新用户偏好设置
  async updatePreferences(preferences: Partial<UserProfile['preferences']>): Promise<UserProfile> {
    return await put<UserProfile>('/users/preferences', { preferences })
  }

  // 获取可用的技能标签
  async getAvailableSkills(): Promise<string[]> {
    return await get<string[]>('/users/skills')
  }

  // 获取部门列表
  async getDepartments(): Promise<string[]> {
    return await get<string[]>('/users/departments')
  }

  // 获取职位列表
  async getPositions(): Promise<string[]> {
    return await get<string[]>('/users/positions')
  }

  // 团队管理功能
  async getTeamMembers(): Promise<TeamMember[]> {
    return await get<TeamMember[]>('/team/members')
  }

  // 邀请用户加入团队
  async inviteUser(data: InviteUserData): Promise<void> {
    await post('/team/invite', data)
  }

  // 移除团队成员
  async removeMember(userId: string): Promise<void> {
    await del(`/team/members/${userId}`)
  }

  // 更新成员角色
  async updateMemberRole(userId: string, role: TeamMember['role']): Promise<TeamMember> {
    return await put<TeamMember>(`/team/members/${userId}/role`, { role })
  }

  // 获取团队邀请列表
  async getTeamInvitations(): Promise<any[]> {
    return await get<any[]>('/team/invitations')
  }

  // 接受团队邀请
  async acceptInvitation(invitationId: string): Promise<void> {
    await post(`/team/invitations/${invitationId}/accept`)
  }

  // 拒绝团队邀请
  async rejectInvitation(invitationId: string): Promise<void> {
    await post(`/team/invitations/${invitationId}/reject`)
  }

  // 撤销团队邀请
  async revokeInvitation(invitationId: string): Promise<void> {
    await del(`/team/invitations/${invitationId}`)
  }

  // 导出用户数据
  async exportUserData(): Promise<Blob> {
    const response = await fetch('/api/users/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('数据导出失败')
    }
    
    return await response.blob()
  }

  // 删除用户账户
  async deleteAccount(password: string): Promise<void> {
    await del('/users/account', { password })
  }

  // 获取账户删除状态
  async getAccountDeletionStatus(): Promise<{ scheduled: boolean; scheduledAt?: string }> {
    return await get('/users/account/deletion-status')
  }

  // 取消账户删除
  async cancelAccountDeletion(): Promise<void> {
    await post('/users/account/cancel-deletion')
  }
}

// 创建服务实例
const userService = new UserService()

// 导出服务实例和静态方法
export const {
  getUserProfile,
  updateUserProfile
} = UserService

export const {
  uploadAvatar,
  deleteAvatar,
  getUsers,
  getUser,
  searchUsers,
  getUserActivity,
  getUserStatistics,
  getUserObjectives,
  getUserTasks,
  updatePreferences,
  getAvailableSkills,
  getDepartments,
  getPositions,
  getTeamMembers,
  inviteUser,
  removeMember,
  updateMemberRole,
  getTeamInvitations,
  acceptInvitation,
  rejectInvitation,
  revokeInvitation,
  exportUserData,
  deleteAccount,
  getAccountDeletionStatus,
  cancelAccountDeletion
} = userService

// 默认导出服务实例
export default userService 
