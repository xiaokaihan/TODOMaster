import React, { useState, useEffect } from 'react'
import { Task, TaskStatus, Priority, CreateTaskDto, UpdateTaskDto, Objective } from '@shared/types'

interface TaskFormProps {
  task?: Task
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => void
  isLoading?: boolean
  objectives?: Objective[] // 用于选择关联目标
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  objectives = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: '',
    estimatedHours: '',
    objectiveId: '',
    keyResultId: '',
    tags: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedDuration ? (task.estimatedDuration / 60).toString() : '',
        objectiveId: task.objectiveId,
        keyResultId: task.keyResultId || '',
        tags: task.tags?.join(', ') || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: '',
        estimatedHours: '',
        objectiveId: objectives.length > 0 ? objectives[0].id : '',
        keyResultId: '',
        tags: ''
      })
    }
    setErrors({})
  }, [task, isOpen, objectives])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '任务标题不能为空'
    }

    if (!task && !formData.objectiveId) {
      newErrors.objectiveId = '必须选择一个关联目标'
    }

    if (formData.estimatedHours && isNaN(parseFloat(formData.estimatedHours))) {
      newErrors.estimatedHours = '预估时长必须是数字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitData: CreateTaskDto | UpdateTaskDto = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      estimatedDuration: formData.estimatedHours ? parseFloat(formData.estimatedHours) * 60 : undefined,
      objectiveId: formData.objectiveId,
      keyResultId: formData.keyResultId || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined
    }

    if (task) {
      // 更新任务
      const updateData: UpdateTaskDto = {
        ...submitData,
        status: formData.status
      }
      onSubmit(updateData)
    } else {
      // 创建任务
      onSubmit(submitData as CreateTaskDto)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {task ? '编辑任务' : '创建任务'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 任务标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入任务标题..."
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入任务描述..."
              disabled={isLoading}
            />
          </div>

          {/* 关联目标 */}
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
              disabled={isLoading || !!task}
            >
              <option value="">选择目标...</option>
              {objectives.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.title}
                </option>
              ))}
            </select>
            {errors.objectiveId && (
              <p className="mt-1 text-sm text-red-600">{errors.objectiveId}</p>
            )}
          </div>

          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              优先级
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as Priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={Priority.LOW}>低</option>
              <option value={Priority.MEDIUM}>中</option>
              <option value={Priority.HIGH}>高</option>
              <option value={Priority.CRITICAL}>紧急</option>
            </select>
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
          </div>

          {/* 预估时长（小时） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预估时长（小时）
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.estimatedHours ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：8"
              disabled={isLoading}
            />
            {errors.estimatedHours && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
            )}
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：开发, 前端, React"
              disabled={isLoading}
            />
          </div>

          {/* 任务状态（仅编辑时显示） */}
          {task && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={TaskStatus.TODO}>待办</option>
                <option value={TaskStatus.IN_PROGRESS}>进行中</option>
                <option value={TaskStatus.WAITING}>等待中</option>
                <option value={TaskStatus.COMPLETED}>已完成</option>
                <option value={TaskStatus.CANCELLED}>已取消</option>
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
              {isLoading ? '保存中...' : task ? '更新任务' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
