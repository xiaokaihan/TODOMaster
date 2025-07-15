import { get } from './api'

// 统计相关类型定义
export interface DashboardStats {
  overview: {
    totalObjectives: number
    completedObjectives: number
    totalKeyResults: number
    achievedKeyResults: number
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    totalWorkHours: number
  }
  trends: {
    objectiveCompletionRate: number[]
    taskCompletionRate: number[]
    productivityScore: number[]
    dates: string[]
  }
  distribution: {
    tasksByStatus: Record<string, number>
    tasksByPriority: Record<string, number>
    objectivesByCategory: Record<string, number>
    keyResultsByType: Record<string, number>
  }
  recentActivity: Array<{
    id: string
    type: 'objective' | 'keyResult' | 'task'
    action: 'created' | 'updated' | 'completed' | 'deleted'
    title: string
    timestamp: string
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
  upcomingDeadlines: Array<{
    id: string
    title: string
    type: 'objective' | 'keyResult' | 'task'
    dueDate: string
    priority?: string
    progress?: number
  }>
}

export interface ProductivityStats {
  daily: {
    date: string
    tasksCompleted: number
    hoursWorked: number
    productivityScore: number
  }[]
  weekly: {
    week: string
    tasksCompleted: number
    hoursWorked: number
    objectivesProgress: number
    averageProductivity: number
  }[]
  monthly: {
    month: string
    objectivesCompleted: number
    keyResultsAchieved: number
    tasksCompleted: number
    totalHours: number
    productivityScore: number
  }[]
}

export interface TeamStats {
  members: Array<{
    user: {
      id: string
      name: string
      avatar?: string
      role: string
    }
    stats: {
      objectivesOwned: number
      tasksAssigned: number
      tasksCompleted: number
      completionRate: number
      hoursWorked: number
      productivityScore: number
    }
  }>
  collaboration: {
    sharedObjectives: number
    crossTeamTasks: number
    averageResponseTime: number
    communicationScore: number
  }
  performance: {
    topPerformers: Array<{
      userId: string
      name: string
      score: number
      improvement: number
    }>
    teamProductivity: number
    teamVelocity: number
    burndownData: Array<{
      date: string
      planned: number
      actual: number
    }>
  }
}

export interface AdvancedAnalytics {
  patterns: {
    peakProductivityHours: number[]
    mostProductiveDays: string[]
    commonBottlenecks: Array<{
      type: string
      frequency: number
      averageDelay: number
    }>
    taskDurationPredictions: Record<string, number>
  }
  recommendations: Array<{
    type: 'productivity' | 'planning' | 'collaboration' | 'health'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    actionItems: string[]
    potentialImpact: number
  }>
  forecasts: {
    objectiveCompletion: Array<{
      objectiveId: string
      title: string
      currentProgress: number
      predictedCompletionDate: string
      confidence: number
    }>
    workloadPrediction: Array<{
      date: string
      predictedTasks: number
      predictedHours: number
      capacity: number
      overloadRisk: number
    }>
  }
}

export interface TimeRangeParams {
  startDate?: string
  endDate?: string
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface StatsFilters {
  userId?: string
  teamId?: string
  objectiveId?: string
  department?: string
  tags?: string[]
}

// 工具函数：构建查询字符串
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// 统计服务类
export class StatsService {
  // 获取仪表板统计数据
  static async getDashboardStats() {
    return await get('/stats/dashboard')
  }

  // 获取生产力统计
  static async getProductivityStats(timeRange?: string) {
    const query = timeRange ? `?timeRange=${timeRange}` : ''
    return await get(`/stats/productivity${query}`)
  }

  // 获取团队统计
  async getTeamStats(params: TimeRangeParams & StatsFilters = {}): Promise<TeamStats> {
    const queryString = buildQueryString(params)
    return await get<TeamStats>(`/stats/team${queryString}`)
  }

  // 获取高级分析数据
  async getAdvancedAnalytics(params: TimeRangeParams & StatsFilters = {}): Promise<AdvancedAnalytics> {
    const queryString = buildQueryString(params)
    return await get<AdvancedAnalytics>(`/stats/analytics${queryString}`)
  }

  // 获取目标完成趋势
  async getObjectiveTrends(params: TimeRangeParams & StatsFilters = {}): Promise<{
    trends: Array<{
      date: string
      created: number
      completed: number
      inProgress: number
      overdue: number
    }>
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/objectives/trends${queryString}`)
  }

  // 获取任务完成趋势
  async getTaskTrends(params: TimeRangeParams & StatsFilters = {}): Promise<{
    trends: Array<{
      date: string
      created: number
      completed: number
      inProgress: number
      overdue: number
    }>
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/tasks/trends${queryString}`)
  }

  // 获取工作时间分析
  async getTimeAnalysis(params: TimeRangeParams & StatsFilters = {}): Promise<{
    dailyHours: Array<{
      date: string
      planned: number
      actual: number
      efficiency: number
    }>
    hourlyDistribution: Array<{
      hour: number
      averageProductivity: number
      tasksCompleted: number
    }>
    weeklyPattern: Array<{
      dayOfWeek: string
      averageHours: number
      productivityScore: number
    }>
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/time-analysis${queryString}`)
  }

  // 获取目标成功率分析
  async getSuccessRateAnalysis(params: TimeRangeParams & StatsFilters = {}): Promise<{
    overall: {
      objectiveSuccessRate: number
      keyResultAchievementRate: number
      taskCompletionRate: number
    }
    byCategory: Record<string, {
      objectiveSuccessRate: number
      sampleSize: number
    }>
    byPriority: Record<string, {
      completionRate: number
      averageCompletionTime: number
    }>
    factors: Array<{
      factor: string
      impact: number
      correlation: number
      description: string
    }>
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/success-rate${queryString}`)
  }

  // 获取瓶颈分析
  async getBottleneckAnalysis(params: TimeRangeParams & StatsFilters = {}): Promise<{
    bottlenecks: Array<{
      type: 'dependency' | 'resource' | 'approval' | 'information'
      description: string
      frequency: number
      averageDelay: number
      affectedTasks: number
      suggestedActions: string[]
    }>
    blockingTasks: Array<{
      taskId: string
      title: string
      blockedTasks: number
      totalDelay: number
      priority: string
    }>
    resourceConstraints: Array<{
      resource: string
      utilization: number
      queueLength: number
      averageWaitTime: number
    }>
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/bottlenecks${queryString}`)
  }

  // 获取协作统计
  async getCollaborationStats(params: TimeRangeParams & StatsFilters = {}): Promise<{
    teamInteractions: Array<{
      fromUser: string
      toUser: string
      interactions: number
      type: 'task_assignment' | 'comment' | 'review' | 'collaboration'
    }>
    communicationFrequency: Array<{
      date: string
      comments: number
      mentions: number
      reviews: number
    }>
    knowledgeSharing: {
      documentsShared: number
      bestPracticesPosted: number
      helpRequests: number
      helpProvided: number
    }
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/collaboration${queryString}`)
  }

  // 获取健康度指标
  async getHealthMetrics(params: TimeRangeParams & StatsFilters = {}): Promise<{
    workLifeBalance: {
      averageWorkHours: number
      overtimeFrequency: number
      weekendWork: number
      vacationUtilization: number
    }
    burnoutRisk: Array<{
      userId: string
      riskLevel: 'low' | 'medium' | 'high'
      factors: string[]
      recommendations: string[]
    }>
    teamMorale: {
      satisfactionScore: number
      engagementLevel: number
      turnoverRisk: number
      feedbackSentiment: number
    }
  }> {
    const queryString = buildQueryString(params)
    return await get(`/stats/health${queryString}`)
  }

  // 导出统计报告
  async exportStatsReport(
    type: 'dashboard' | 'productivity' | 'team' | 'analytics',
    params: TimeRangeParams & StatsFilters = {},
    format: 'pdf' | 'excel' | 'csv' = 'pdf'
  ): Promise<Blob> {
    const queryString = buildQueryString({ ...params, format })
    const response = await fetch(`/api/stats/${type}/export${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('报告导出失败')
    }
    
    return await response.blob()
  }

  // 获取实时统计数据
  async getRealTimeStats(): Promise<{
    activeUsers: number
    ongoingTasks: number
    todayCompletions: number
    systemLoad: number
    lastUpdated: string
  }> {
    return await get('/stats/realtime')
  }

  // 获取目标相关的详细统计
  async getObjectiveDetailedStats(objectiveId: string): Promise<{
    objective: any
    keyResults: Array<{
      id: string
      title: string
      progress: number
      target: number
      current: number
      trend: 'improving' | 'declining' | 'stable'
    }>
    tasks: {
      total: number
      completed: number
      inProgress: number
      overdue: number
      averageCompletionTime: number
    }
    timeline: Array<{
      date: string
      event: string
      progress: number
    }>
  }> {
    return await get(`/stats/objectives/${objectiveId}/detailed`)
  }
}

// 创建服务实例
const statsService = new StatsService()

// 导出服务实例和静态方法
export const {
  getDashboardStats,
  getProductivityStats
} = StatsService

export const {
  getTeamStats,
  getAdvancedAnalytics,
  getObjectiveTrends,
  getTaskTrends,
  getTimeAnalysis,
  getSuccessRateAnalysis,
  getBottleneckAnalysis,
  getCollaborationStats,
  getHealthMetrics,
  exportStatsReport,
  getRealTimeStats,
  getObjectiveDetailedStats
} = statsService

// 默认导出服务实例
export default statsService 
