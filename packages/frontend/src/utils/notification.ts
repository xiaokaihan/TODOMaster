// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

// 通知配置
export interface NotificationConfig {
  type: NotificationType
  title: string
  message?: string
  duration?: number // 持续时间（毫秒），0表示不自动关闭
  action?: {
    label: string
    handler: () => void
  }
}

// 通知项
export interface NotificationItem {
  id: string
  config: NotificationConfig
  timestamp: number
}

// 通知管理器
class NotificationManager {
  private notifications: NotificationItem[] = []
  private listeners: Array<(notifications: NotificationItem[]) => void> = []
  private idCounter = 0

  // 添加通知
  show(config: NotificationConfig): string {
    const id = `notification-${Date.now()}-${this.idCounter++}`
    const notification: NotificationItem = {
      id,
      config: {
        duration: 4000, // 默认4秒
        ...config
      },
      timestamp: Date.now()
    }

    this.notifications.push(notification)
    this.notifyListeners()

    // 自动移除通知
    if (notification.config.duration && notification.config.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, notification.config.duration)
    }

    return id
  }

  // 移除通知
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notifyListeners()
  }

  // 清除所有通知
  clear(): void {
    this.notifications = []
    this.notifyListeners()
  }

  // 获取所有通知
  getAll(): NotificationItem[] {
    return [...this.notifications]
  }

  // 订阅通知变化
  subscribe(listener: (notifications: NotificationItem[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener([...this.notifications])
    })
  }
}

// 全局通知管理器实例
export const notificationManager = new NotificationManager()

// 便捷函数
export const showSuccess = (title: string, message?: string, duration?: number): string => {
  return notificationManager.show({
    type: 'success',
    title,
    message,
    duration
  })
}

export const showError = (title: string, message?: string, duration?: number): string => {
  return notificationManager.show({
    type: 'error',
    title,
    message,
    duration: duration || 6000 // 错误消息默认显示更久
  })
}

export const showWarning = (title: string, message?: string, duration?: number): string => {
  return notificationManager.show({
    type: 'warning',
    title,
    message,
    duration
  })
}

export const showInfo = (title: string, message?: string, duration?: number): string => {
  return notificationManager.show({
    type: 'info',
    title,
    message,
    duration
  })
}

// API错误处理函数
export const handleApiError = (error: any, defaultMessage = '操作失败'): void => {
  console.error('API错误:', error)
  
  let title = defaultMessage
  let message = ''
  
  if (error?.message) {
    title = error.message
  }
  
  if (error?.errors && Array.isArray(error.errors)) {
    message = error.errors.join(', ')
  }
  
  if (error?.status === 401) {
    title = '认证失败'
    message = '请重新登录'
  } else if (error?.status === 403) {
    title = '权限不足'
    message = '您没有执行此操作的权限'
  } else if (error?.status === 404) {
    title = '资源不存在'
    message = '请求的资源未找到'
  } else if (error?.status === 500) {
    title = '服务器错误'
    message = '请稍后重试或联系管理员'
  } else if (error?.status === 0) {
    title = '网络错误'
    message = '请检查网络连接'
  }
  
  showError(title, message)
} 