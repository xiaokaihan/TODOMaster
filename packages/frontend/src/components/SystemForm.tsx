import React, { useState, useEffect } from 'react'
import { System, SystemStatus, CreateSystemDto, UpdateSystemDto } from '@shared/types'

// 预设颜色
const PRESET_COLORS = [
  '#6366F1', '#2563EB', '#16A34A', '#D97706', '#CA8A04',
  '#DC2626', '#9333EA', '#0891B2', '#DB2777', '#6B7280'
]

// 预设图标
const PRESET_ICONS = [
  '💼', '💪', '📚', '💰', '❤️', '🎨', '👤', '🏠',
  '🎯', '⚡', '🌟', '🔥', '📋', '🧠', '🎓', '🏆'
]

interface SystemFormProps {
  system?: System
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSystemDto | UpdateSystemDto) => void
  isLoading?: boolean
}

const SystemForm: React.FC<SystemFormProps> = ({
  system,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📋',
    color: '#6366F1',
    status: SystemStatus.ACTIVE
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (system) {
      setFormData({
        name: system.name,
        description: system.description || '',
        icon: system.icon || '📋',
        color: system.color || '#6366F1',
        status: system.status
      })
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '📋',
        color: '#6366F1',
        status: SystemStatus.ACTIVE
      })
    }
    setErrors({})
  }, [system, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = '系统名称不能为空'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '系统名称不能少于2个字符'
    }
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '描述不能超过2000个字符'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const submitData: any = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon,
      color: formData.color
    }

    if (system) {
      submitData.status = formData.status
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {system ? '编辑系统' : '创建系统'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isLoading}>
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              系统名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：健康体系、职业发展..."
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="描述这个系统的目的和范围..."
              disabled={isLoading}
            />
          </div>

          {/* 图标选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">图标</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`w-10 h-10 text-xl flex items-center justify-center rounded-lg border-2 transition-colors ${
                    formData.icon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">主题色</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 状态（仅编辑时） */}
          {system && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SystemStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={SystemStatus.ACTIVE}>活跃</option>
                <option value={SystemStatus.PAUSED}>暂停</option>
                <option value={SystemStatus.ARCHIVED}>归档</option>
              </select>
            </div>
          )}

          {/* 预览 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">预览</label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                {formData.icon}
              </div>
              <span className="font-medium text-gray-900">{formData.name || '系统名称'}</span>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : system ? '更新系统' : '创建系统'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SystemForm
