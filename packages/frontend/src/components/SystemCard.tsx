import React from 'react'
import { System, SystemStatus } from '@shared/types'

interface SystemCardProps {
  system: System
  onClick: (system: System) => void
  onEdit: (system: System) => void
  onArchive?: (system: System) => void
}

const SystemCard: React.FC<SystemCardProps> = ({ system, onClick, onEdit, onArchive }) => {
  const statusLabel: Record<SystemStatus, { text: string; className: string }> = {
    [SystemStatus.ACTIVE]: { text: '活跃', className: 'bg-green-100 text-green-800' },
    [SystemStatus.PAUSED]: { text: '暂停', className: 'bg-yellow-100 text-yellow-800' },
    [SystemStatus.ARCHIVED]: { text: '归档', className: 'bg-gray-100 text-gray-600' }
  }

  const progress = system.overallProgress || 0
  const total = system.objectiveCount || 0
  const active = system.activeObjectiveCount || 0
  const completed = system.completedObjectiveCount || 0

  // 环形进度条参数
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(system)}
    >
      <div className="p-5">
        {/* 头部：图标 + 名称 + 状态 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${system.color || '#6366F1'}20` }}
            >
              {system.icon || '📋'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {system.name}
              </h3>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusLabel[system.status].className}`}>
                {statusLabel[system.status].text}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onEdit(system)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="编辑"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {onArchive && system.status !== SystemStatus.ARCHIVED && (
              <button
                onClick={() => onArchive(system)}
                className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                title="归档"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 描述 */}
        {system.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{system.description}</p>
        )}

        {/* 进度环 + 统计 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 环形进度 */}
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none" stroke="#E5E7EB" strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke={system.color || '#6366F1'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{progress}%</span>
              </div>
            </div>

            {/* 统计数字 */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{total}</span> 个目标
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">{active}</span> 进行中
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">{completed}</span> 已完成
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemCard
