import React from 'react'
import { KeyResult, KeyResultType, KeyResultStatus } from '@shared/types'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PlayIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'

interface KeyResultCardProps {
  keyResult: KeyResult
  onEdit?: (keyResult: KeyResult) => void
  onDelete?: (keyResult: KeyResult) => void
  onUpdateProgress?: (keyResult: KeyResult, newValue: number) => void
}

export const KeyResultCard: React.FC<KeyResultCardProps> = ({
  keyResult,
  onEdit,
  onDelete,
  onUpdateProgress
}) => {
  // 获取状态图标
  const getStatusIcon = (status: KeyResultStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <PlayIcon className="w-5 h-5 text-blue-500" />
      case 'NOT_STARTED':
        return <ClockIcon className="w-5 h-5 text-gray-400" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: KeyResultStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50'
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-50'
      case 'NOT_STARTED':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // 获取类型标签
  const getTypeLabel = (type: KeyResultType) => {
    switch (type) {
      case 'NUMERIC':
        return '数值型'
      case 'PERCENTAGE':
        return '百分比'
      case 'BOOLEAN':
        return '布尔型'
      default:
        return '未知'
    }
  }

  // 格式化进度显示
  const formatProgress = () => {
    switch (keyResult.type) {
      case 'NUMERIC':
        return `${keyResult.currentValue} / ${keyResult.targetValue} ${keyResult.unit || ''}`
      case 'PERCENTAGE':
        return `${keyResult.currentValue}% / ${keyResult.targetValue}%`
      case 'BOOLEAN':
        return keyResult.currentValue >= keyResult.targetValue ? '已完成' : '未完成'
      default:
        return `${keyResult.progress}%`
    }
  }

  // 处理进度更新
  const handleProgressUpdate = (increment: number) => {
    if (!onUpdateProgress) return
    
    let newValue = keyResult.currentValue + increment
    
    // 根据类型限制值的范围
    switch (keyResult.type) {
      case 'PERCENTAGE':
        newValue = Math.max(0, Math.min(100, newValue))
        break
      case 'BOOLEAN':
        newValue = newValue > 0 ? 1 : 0
        break
      case 'NUMERIC':
        newValue = Math.max(0, newValue)
        break
    }
    
    onUpdateProgress(keyResult, newValue)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(keyResult.status)}
            <h3 className="text-lg font-semibold text-gray-900">
              {keyResult.title}
            </h3>
          </div>
          
          {keyResult.description && (
            <p className="text-gray-600 text-sm mb-3">
              {keyResult.description}
            </p>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(keyResult)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="编辑关键结果"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(keyResult)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除关键结果"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 类型和状态标签 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {getTypeLabel(keyResult.type)}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(keyResult.status)}`}>
          {keyResult.status === 'COMPLETED' ? '已完成' : 
           keyResult.status === 'IN_PROGRESS' ? '进行中' : '未开始'}
        </span>
      </div>

      {/* 进度显示 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">进度</span>
          <span className="text-sm text-gray-600">{formatProgress()}</span>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              keyResult.progress >= 100 ? 'bg-green-500' :
              keyResult.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(100, keyResult.progress)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">0</span>
          <span className="text-xs font-medium text-gray-700">
            {keyResult.progress.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">100%</span>
        </div>
      </div>

      {/* 快速操作按钮 */}
      {onUpdateProgress && keyResult.status !== 'COMPLETED' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">快速更新:</span>
          
          {keyResult.type === 'BOOLEAN' ? (
            <button
              onClick={() => handleProgressUpdate(keyResult.targetValue)}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              标记完成
            </button>
          ) : (
            <>
              <button
                onClick={() => handleProgressUpdate(-1)}
                disabled={keyResult.currentValue <= 0}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -1
              </button>
              <button
                onClick={() => handleProgressUpdate(1)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                +1
              </button>
              {keyResult.type === 'NUMERIC' && (
                <button
                  onClick={() => handleProgressUpdate(5)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  +5
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* 截止日期 */}
      {keyResult.dueDate && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              截止日期: {new Date(keyResult.dueDate).toLocaleDateString()}
            </span>
            {new Date(keyResult.dueDate) < new Date() && keyResult.status !== 'COMPLETED' && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                已逾期
              </span>
            )}
          </div>
        </div>
      )}

      {/* 时间信息 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>创建时间: {new Date(keyResult.createdAt).toLocaleDateString()}</span>
          {keyResult.updatedAt !== keyResult.createdAt && (
            <span>更新时间: {new Date(keyResult.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
        {keyResult.completedAt && (
          <div className="mt-1 text-xs text-green-600">
            完成时间: {new Date(keyResult.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
} 