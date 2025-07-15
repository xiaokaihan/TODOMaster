import React from 'react'
import { Objective, ObjectiveStatus, Priority, ObjectiveCategory } from '@shared/types'
import { getObjectiveStatusLabel, getPriorityLabel, getPriorityColor } from '@shared/utils'

interface ObjectiveCardProps {
  objective: Objective
  onEdit?: (objective: Objective) => void
  onDelete?: (id: string) => void
  onViewTasks?: (objective: Objective) => void
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onEdit,
  onDelete,
  onViewTasks,
}) => {
  const getStatusColor = (status: ObjectiveStatus) => {
    const colors = {
      [ObjectiveStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [ObjectiveStatus.ACTIVE]: 'bg-blue-100 text-blue-800',
      [ObjectiveStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800',
      [ObjectiveStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ObjectiveStatus.CANCELLED]: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getCategoryIcon = (category: ObjectiveCategory) => {
    const icons = {
      [ObjectiveCategory.PERSONAL]: '👤',
      [ObjectiveCategory.PROFESSIONAL]: '💼',
      [ObjectiveCategory.HEALTH]: '💪',
      [ObjectiveCategory.LEARNING]: '📚',
      [ObjectiveCategory.FINANCIAL]: '💰',
      [ObjectiveCategory.RELATIONSHIP]: '❤️',
      [ObjectiveCategory.CREATIVE]: '🎨',
      [ObjectiveCategory.OTHER]: '📋',
    }
    return icons[category] || '📋'
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

  // 修改日期处理逻辑
  const formatLocalDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const today = getDateString(new Date());

  const isOverdue = objective.targetDate && 
    formatLocalDate(objective.targetDate) < today && 
    objective.status !== ObjectiveStatus.COMPLETED;

  const isCompleted = objective.status === ObjectiveStatus.COMPLETED;
  const progress = objective.progress || 0;

  // 计算剩余天数
  const getDaysRemaining = () => {
    if (!objective.targetDate) return null;
    const targetDate = new Date(formatLocalDate(objective.targetDate));
    const nowDate = new Date(today);
    const diffTime = targetDate.getTime() - nowDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border ${isOverdue ? 'border-red-300' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
      {/* 标题栏 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getCategoryIcon(objective.category)}</span>
            <span className="text-lg">{getPriorityIcon(objective.priority)}</span>
            <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {objective.title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}
            >
              {getObjectiveStatusLabel(objective.status)}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getPriorityColor(objective.priority) }}
            >
              {getPriorityLabel(objective.priority)}
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
          {onViewTasks && (
            <button
              onClick={() => onViewTasks(objective)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="查看任务和关键结果"
            >
              👁️
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(objective)}
              className="text-gray-600 hover:text-gray-800 text-sm"
              title="编辑"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(objective.id)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="删除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 描述 */}
      {objective.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {objective.description}
        </p>
      )}

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">完成进度</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress === 100 ? 'bg-green-600' : progress >= 75 ? 'bg-blue-600' : progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 时间信息 */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
        {objective.startDate && (
          <div>
            <span className="font-medium">开始时间:</span>
            <div>{formatLocalDate(objective.startDate)}</div>
          </div>
        )}
        
        {objective.targetDate && (
          <div>
            <span className="font-medium">目标时间:</span>
            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatLocalDate(objective.targetDate)}
            </div>
          </div>
        )}
      </div>

      {/* 剩余时间提醒 */}
      {daysRemaining !== null && !isCompleted && (
        <div className={`text-sm p-2 rounded mb-4 ${
          daysRemaining < 0 ? 'bg-red-50 text-red-700' :
          daysRemaining <= 7 ? 'bg-yellow-50 text-yellow-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {daysRemaining < 0 ? `已逾期 ${Math.abs(daysRemaining)} 天` :
           daysRemaining === 0 ? '今日到期' :
           daysRemaining <= 7 ? `还剩 ${daysRemaining} 天` :
           `还剩 ${daysRemaining} 天`}
        </div>
      )}

      {/* 任务统计 */}
      {objective.tasks && objective.tasks.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">关联任务:</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">{objective.tasks.length} 个</span>
              <span className="text-green-600">
                {objective.tasks.filter(task => task.status === 'COMPLETED').length} 已完成
              </span>
            </div>
          </div>
          
          {/* 任务进度条 */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-600 h-1 rounded-full"
                style={{
                  width: `${objective.tasks.length > 0 ? 
                    (objective.tasks.filter(task => task.status === 'COMPLETED').length / objective.tasks.length) * 100 : 0
                  }%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-400">
        <span>创建于 {formatLocalDate(objective.createdAt)}</span>
        <span>更新于 {formatLocalDate(objective.updatedAt)}</span>
      </div>
    </div>
  )
}

export default ObjectiveCard 