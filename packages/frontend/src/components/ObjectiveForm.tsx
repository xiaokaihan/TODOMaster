import React, { useState, useEffect } from 'react'
import { Objective, Priority, ObjectiveStatus, CreateObjectiveDto, UpdateObjectiveDto, System } from '@shared/types'
import { SystemService } from '../services/systemService'

interface ObjectiveFormProps {
  objective?: Objective
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateObjectiveDto | UpdateObjectiveDto) => void
  isLoading?: boolean
  defaultSystemId?: string
}

const ObjectiveForm: React.FC<ObjectiveFormProps> = ({
  objective,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  defaultSystemId
}) => {
  const [systems, setSystems] = useState<System[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    systemId: '',
    priority: Priority.MEDIUM,
    startDate: '',
    targetDate: '',
    status: ObjectiveStatus.DRAFT
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 加载系统列表
  useEffect(() => {
    if (isOpen) {
      SystemService.getSystems({ status: 'ACTIVE' as any }).then(setSystems).catch(console.error)
    }
  }, [isOpen])

  useEffect(() => {
    if (objective) {
      setFormData({
        title: objective.title,
        description: objective.description || '',
        systemId: objective.systemId || '',
        priority: objective.priority,
        startDate: objective.startDate ? new Date(objective.startDate).toISOString().split('T')[0] : '',
        targetDate: objective.targetDate ? new Date(objective.targetDate).toISOString().split('T')[0] : '',
        status: objective.status
      })
    } else {
      setFormData({
        title: '',
        description: '',
        systemId: defaultSystemId || '',
        priority: Priority.MEDIUM,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        status: ObjectiveStatus.DRAFT
      })
    }
    setErrors({})
  }, [objective, isOpen, defaultSystemId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '目标标题不能为空'
    } else if (formData.title.length > 100) {
      newErrors.title = '目标标题不能超过100个字符'
    }

    if (!formData.systemId) {
      newErrors.systemId = '请选择所属系统'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '目标描述不能超过500个字符'
    }

    if (!formData.startDate) {
      newErrors.startDate = '开始日期不能为空'
    }

    if (formData.targetDate && formData.startDate && new Date(formData.targetDate) <= new Date(formData.startDate)) {
      newErrors.targetDate = '目标日期必须晚于开始日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      systemId: formData.systemId,
      priority: formData.priority,
      startDate: new Date(formData.startDate),
      targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
      ...(objective && { status: formData.status })
    }

    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {objective ? '编辑目标' : '创建目标'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 目标标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入目标标题..."
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 目标描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="详细描述你的目标..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* 所属系统和优先级 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属系统 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.systemId}
                onChange={(e) => handleInputChange('systemId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.systemId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">请选择系统...</option>
                {systems.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.icon} {system.name}
                  </option>
                ))}
              </select>
              {errors.systemId && (
                <p className="mt-1 text-sm text-red-600">{errors.systemId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={Priority.LOW}>🟢 低</option>
                <option value={Priority.MEDIUM}>🟡 中</option>
                <option value={Priority.HIGH}>🟠 高</option>
                <option value={Priority.CRITICAL}>🔴 紧急</option>
              </select>
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标日期
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleInputChange('targetDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.targetDate ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.targetDate && (
                <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>
              )}
            </div>
          </div>

          {/* 状态（仅编辑时显示） */}
          {objective && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={ObjectiveStatus.DRAFT}>草稿</option>
                <option value={ObjectiveStatus.ACTIVE}>进行中</option>
                <option value={ObjectiveStatus.ON_HOLD}>暂停</option>
                <option value={ObjectiveStatus.COMPLETED}>已完成</option>
                <option value={ObjectiveStatus.CANCELLED}>已取消</option>
              </select>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : objective ? '更新目标' : '创建目标'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ObjectiveForm
