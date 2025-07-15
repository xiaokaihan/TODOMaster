import React from 'react'
import { Task, TaskStatus, Priority } from '@shared/types'
import { formatDate, formatDateTime, getTaskStatusLabel, getPriorityLabel, getPriorityColor, formatDuration } from '@shared/utils'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: TaskStatus) => void
  onStart?: (id: string) => void
  onComplete?: (id: string) => void
  showObjective?: boolean
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange: _onStatusChange,
  onStart,
  onComplete,
  showObjective: _showObjective = false,
}) => {
  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      [TaskStatus.TODO]: 'bg-gray-100 text-gray-800',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [TaskStatus.WAITING]: 'bg-yellow-100 text-yellow-800',
      [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [TaskStatus.CANCELLED]: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getPriorityIcon = (priority: Priority) => {
    const icons = {
      [Priority.LOW]: '🟢',
      [Priority.MEDIUM]: '🟡',
      [Priority.HIGH]: '🟠',
      [Priority.CRITICAL]: '🔴',
    }
    return icons[priority]
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED
  const canStart = task.status === TaskStatus.TODO
  const canComplete = task.status === TaskStatus.IN_PROGRESS
  const isCompleted = task.status === TaskStatus.COMPLETED

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border ${isOverdue ? 'border-red-300' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
      {/* 标题栏 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getPriorityIcon(task.priority)}</span>
            <h4 className={`text-base font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h4>
          </div>
          
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
            >
              {getTaskStatusLabel(task.status)}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
              {getPriorityLabel(task.priority)}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                逾期
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          {canStart && onStart && (
            <button
              onClick={() => onStart(task.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="开始任务"
            >
              ▶️
            </button>
          )}
          {canComplete && onComplete && (
            <button
              onClick={() => onComplete(task.id)}
              className="text-green-600 hover:text-green-800 text-sm"
              title="完成任务"
            >
              ✅
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-gray-600 hover:text-gray-800 text-sm"
              title="编辑"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="删除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 描述 */}
      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* 时间信息 */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
        {task.dueDate && (
          <div>
            <span className="font-medium">截止时间:</span>
            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDateTime(task.dueDate)}
            </div>
          </div>
        )}
        
        {task.estimatedDuration && (
          <div>
            <span className="font-medium">预估时长:</span>
            <div>{formatDuration(task.estimatedDuration)}</div>
          </div>
        )}
        
        {task.actualDuration && (
          <div>
            <span className="font-medium">实际时长:</span>
            <div>{formatDuration(task.actualDuration)}</div>
          </div>
        )}
        
        {task.completedAt && (
          <div>
            <span className="font-medium">完成时间:</span>
            <div>{formatDateTime(task.completedAt)}</div>
          </div>
        )}
      </div>

      {/* 标签 */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 依赖关系 */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="text-xs text-gray-500 mb-3">
          <span className="font-medium">依赖任务:</span> {task.dependencies.length} 个
        </div>
      )}

      {/* 操作按钮区域 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {canStart && onStart && (
            <button
              onClick={() => onStart(task.id)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              开始
            </button>
          )}
          {canComplete && onComplete && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              完成
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-400">
          创建于 {formatDate(task.createdAt)}
        </div>
      </div>
    </div>
  )
}

export default TaskCard 