import React, { useState, useEffect } from 'react'
import {
  notificationManager,
  NotificationItem,
  NotificationType
} from '../utils/notification'

// 通知样式配置
const getNotificationStyles = (type: NotificationType) => {
  const baseStyles = 'p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform'
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-50 border-green-400 text-green-800`
    case 'error':
      return `${baseStyles} bg-red-50 border-red-400 text-red-800`
    case 'warning':
      return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`
    case 'info':
      return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`
    default:
      return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`
  }
}

// 获取通知图标
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return '📋'
  }
}

// 单个通知组件
interface NotificationProps {
  notification: NotificationItem
  onClose: (id: string) => void
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 添加进入动画
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // 等待动画完成后移除
    setTimeout(() => onClose(notification.id), 300)
  }

  const { config } = notification

  return (
    <div
      className={`${getNotificationStyles(config.type)} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ marginBottom: '0.5rem' }}
    >
      <div className="flex items-start">
        <span className="text-lg mr-3 flex-shrink-0">
          {getNotificationIcon(config.type)}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{config.title}</h4>
              {config.message && (
                <p className="text-sm opacity-90 mt-1">{config.message}</p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="ml-4 text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              title="关闭"
            >
              ✕
            </button>
          </div>
          
          {config.action && (
            <div className="mt-3">
              <button
                onClick={() => {
                  config.action!.handler()
                  handleClose()
                }}
                className="text-sm font-medium underline hover:no-underline transition-all"
              >
                {config.action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 通知容器组件
const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    // 订阅通知变化
    const unsubscribe = notificationManager.subscribe(setNotifications)
    
    // 初始化当前通知列表
    setNotifications(notificationManager.getAll())
    
    return unsubscribe
  }, [])

  const handleClose = (id: string) => {
    notificationManager.remove(id)
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-full">
      <div className="space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={handleClose}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationContainer 