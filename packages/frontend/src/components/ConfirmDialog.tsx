import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'danger',
  isLoading = false
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        }
      case 'warning':
        return {
          icon: '⚠️',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        }
      default:
        return {
          icon: '⚠️',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        }
    }
  }

  const styles = getTypeStyles()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${styles.iconBg} mr-4`}>
              <span className="text-lg">{styles.icon}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 flex items-center justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBg}`}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog 