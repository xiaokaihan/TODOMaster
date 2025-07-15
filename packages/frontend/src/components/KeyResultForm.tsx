import React, { useState, useEffect } from 'react'
import { KeyResult, CreateKeyResultDto, UpdateKeyResultDto, KeyResultType, KeyResultStatus, Objective } from '@shared/types'

interface KeyResultFormProps {
  keyResult?: KeyResult
  objectiveId?: string
  objectives?: Objective[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateKeyResultDto | UpdateKeyResultDto) => void
  isLoading?: boolean
}

const KeyResultForm: React.FC<KeyResultFormProps> = ({
  keyResult,
  objectiveId,
  objectives = [],
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: KeyResultType.NUMERIC,
    targetValue: '',
    currentValue: '',
    unit: '',
    dueDate: '',
    objectiveId: '',
    status: KeyResultStatus.NOT_STARTED
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (keyResult) {
      setFormData({
        title: keyResult.title,
        description: keyResult.description || '',
        type: keyResult.type,
        targetValue: keyResult.targetValue.toString(),
        currentValue: keyResult.currentValue.toString(),
        unit: keyResult.unit || '',
        dueDate: keyResult.dueDate ? keyResult.dueDate.toISOString().split('T')[0] : '',
        objectiveId: keyResult.objectiveId,
        status: keyResult.status
      })
    } else {
      // 智能默认选择目标
      const defaultObjectiveId = objectiveId ||
        (objectives?.length === 1 ? objectives[0].id : '') ||
        (objectives?.length > 0 ? objectives[0].id : '')

      setFormData({
        title: '',
        description: '',
        type: KeyResultType.NUMERIC,
        targetValue: '',
        currentValue: '0',
        unit: '',
        dueDate: '',
        objectiveId: defaultObjectiveId,
        status: KeyResultStatus.NOT_STARTED
      })
    }
    setErrors({})
  }, [keyResult, isOpen, objectiveId, objectives])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '关键结果标题不能为空'
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (!keyResult && !formData.objectiveId) {
      newErrors.objectiveId = '请选择一个目标'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述不能超过500个字符'
    }

    const targetValue = parseFloat(formData.targetValue)
    if (isNaN(targetValue) || targetValue <= 0) {
      newErrors.targetValue = '目标值必须是大于0的数字'
    }

    const currentValue = parseFloat(formData.currentValue)
    if (isNaN(currentValue) || currentValue < 0) {
      newErrors.currentValue = '当前值必须是非负数'
    }

    if (formData.type === KeyResultType.PERCENTAGE) {
      if (targetValue > 100) {
        newErrors.targetValue = '百分比类型的目标值不能超过100'
      }
      if (currentValue > 100) {
        newErrors.currentValue = '百分比类型的当前值不能超过100'
      }
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
      type: formData.type,
      targetValue: parseFloat(formData.targetValue),
      currentValue: parseFloat(formData.currentValue),
      unit: formData.unit.trim() || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      ...(keyResult ? { status: formData.status } : { objectiveId: formData.objectiveId })
    }

    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getTypeLabel = (type: KeyResultType) => {
    switch (type) {
      case KeyResultType.NUMERIC:
        return '数值型'
      case KeyResultType.PERCENTAGE:
        return '百分比型'
      case KeyResultType.BOOLEAN:
        return '布尔型'
      default:
        return '未知'
    }
  }

  const getTypeDescription = (type: KeyResultType) => {
    switch (type) {
      case KeyResultType.NUMERIC:
        return '如：阅读5本书、完成10个任务'
      case KeyResultType.PERCENTAGE:
        return '如：提升20%、完成80%'
      case KeyResultType.BOOLEAN:
        return '如：是否完成、是否通过'
      default:
        return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {keyResult ? '编辑关键结果' : '创建关键结果'}
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
          {/* 目标选择（仅创建时显示） */}
          {!keyResult && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关联目标 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.objectiveId}
                onChange={(e) => handleInputChange('objectiveId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.objectiveId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">请选择目标</option>
                {objectives?.map(objective => (
                  <option key={objective.id} value={objective.id}>
                    {objective.title}
                  </option>
                )) || []}
              </select>
              {errors.objectiveId && (
                <p className="mt-1 text-sm text-red-600">{errors.objectiveId}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                选择这个关键结果要关联的目标
              </p>
            </div>
          )}

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关键结果标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入关键结果标题..."
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="详细描述关键结果..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* 类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {Object.values(KeyResultType).map(type => (
                <label key={type} className="flex items-start">
                  <input
                    type="radio"
                    value={type}
                    checked={formData.type === type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mt-1 mr-3"
                    disabled={isLoading}
                  />
                  <div>
                    <div className="font-medium">{getTypeLabel(type)}</div>
                    <div className="text-sm text-gray-600">{getTypeDescription(type)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 数值和单位 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标值 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => handleInputChange('targetValue', e.target.value)}
                min="0"
                step={formData.type === KeyResultType.PERCENTAGE ? "0.1" : "any"}
                max={formData.type === KeyResultType.PERCENTAGE ? "100" : undefined}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.targetValue ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.targetValue && (
                <p className="mt-1 text-sm text-red-600">{errors.targetValue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前值 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => handleInputChange('currentValue', e.target.value)}
                min="0"
                step={formData.type === KeyResultType.PERCENTAGE ? "0.1" : "any"}
                max={formData.type === KeyResultType.PERCENTAGE ? "100" : undefined}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.currentValue ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.currentValue && (
                <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                单位
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.type === KeyResultType.PERCENTAGE ? "%" : "如：本、个、次"}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              截止日期
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500">
              设置关键结果的预期完成日期（可选）
            </p>
          </div>

          {/* 状态（仅编辑时显示） */}
          {keyResult && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={KeyResultStatus.NOT_STARTED}>未开始</option>
                <option value={KeyResultStatus.IN_PROGRESS}>进行中</option>
                <option value={KeyResultStatus.COMPLETED}>已完成</option>
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
              {isLoading ? '保存中...' : keyResult ? '更新关键结果' : '创建关键结果'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KeyResultForm 