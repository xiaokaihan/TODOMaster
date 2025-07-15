import React, { useState, useEffect } from 'react'
import { KeyResult, KeyResultType, KeyResultStatus, CreateKeyResultDto, UpdateKeyResultDto, Objective } from '@shared/types'
import { KeyResultCard } from '../components/KeyResultCard'
import KeyResultForm from '../components/KeyResultForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { KeyResultService, KeyResultListParams } from '../services/keyResultService'
import { ObjectiveService } from '../services/objectiveService'
import { showSuccess, handleApiError } from '../utils/notification'

export const KeyResults: React.FC = () => {
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('')
  const [filter, setFilter] = useState<{
    status?: KeyResultStatus
    type?: KeyResultType
    objectiveId?: string
  }>({})

  // 表单和对话框状态
  const [showKeyResultForm, setShowKeyResultForm] = useState(false)
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingKeyResult, setDeletingKeyResult] = useState<KeyResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 搜索和排序
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // 加载目标列表（用于选择）
  const loadObjectives = async () => {
    try {
      const response = await ObjectiveService.getObjectives({ limit: 100 })
      if (response.data) {
        setObjectives(response.data)
      }
    } catch (error) {
      handleApiError(error, '加载目标列表失败')
    }
  }

  // 加载关键结果列表
  const loadKeyResults = async (params: KeyResultListParams = {}) => {
    try {
      setIsLoading(true)
      
      const queryParams: KeyResultListParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: filter.status,
        type: filter.type,
        objectiveId: filter.objectiveId || selectedObjectiveId || undefined,
        sortBy: sortBy,
        sortOrder: 'desc',
        ...params
      }

      const response = await KeyResultService.getKeyResults(queryParams)

      if (response) {
        setKeyResults(response.data)
        setPagination(response.pagination)
      }
    } catch (error) {
      handleApiError(error, '加载关键结果列表失败')
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    Promise.all([
      loadObjectives(),
      loadKeyResults()
    ])
  }, [])

  // 搜索和过滤变化时重新加载
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
      loadKeyResults({ page: 1 })
    }, 300) // 防抖

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filter, selectedObjectiveId, sortBy])

  // 创建关键结果
  const handleCreateKeyResult = () => {
    setEditingKeyResult(null)
    setShowKeyResultForm(true)
  }

  // 编辑关键结果
  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditingKeyResult(keyResult)
    setShowKeyResultForm(true)
  }

  // 删除关键结果
  const handleDeleteKeyResult = (keyResult: KeyResult) => {
    setDeletingKeyResult(keyResult)
    setShowDeleteDialog(true)
  }

  // 提交关键结果表单
  const handleSubmitKeyResult = async (data: CreateKeyResultDto | UpdateKeyResultDto) => {
    setIsLoading(true)
    try {
      if (editingKeyResult) {
        // 更新关键结果
        const updatedKeyResult = await KeyResultService.updateKeyResult(editingKeyResult.id, data as UpdateKeyResultDto)
        
        // 更新本地状态
        setKeyResults(prev => prev.map(kr => 
          kr.id === editingKeyResult.id ? updatedKeyResult : kr
        ))
        
        showSuccess('关键结果更新成功', `关键结果"${updatedKeyResult.title}"已成功更新`)
      } else {
        // 创建关键结果
        const createData = data as CreateKeyResultDto

        const newKeyResult = await KeyResultService.createKeyResult(createData)

        // 重新加载列表
        await loadKeyResults()

        showSuccess('关键结果创建成功', `关键结果"${newKeyResult.title}"已成功创建`)
      }
      
      setShowKeyResultForm(false)
      setEditingKeyResult(null)
    } catch (error) {
      handleApiError(error, editingKeyResult ? '更新关键结果失败' : '创建关键结果失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 确认删除关键结果
  const confirmDeleteKeyResult = async () => {
    if (!deletingKeyResult) return
    
    setIsLoading(true)
    try {
      await KeyResultService.deleteKeyResult(deletingKeyResult.id)
      
      // 更新本地状态
      setKeyResults(prev => prev.filter(kr => kr.id !== deletingKeyResult.id))
      
      setShowDeleteDialog(false)
      setDeletingKeyResult(null)
      showSuccess('关键结果删除成功', '关键结果已被删除')
    } catch (error) {
      handleApiError(error, '删除关键结果失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 更新关键结果进度
  const handleUpdateProgress = async (keyResult: KeyResult, newValue: number) => {
    try {
      const updatedKeyResult = await KeyResultService.updateKeyResultProgress(keyResult.id, newValue)
      
      // 更新本地状态
      setKeyResults(prev => prev.map(kr =>
        kr.id === keyResult.id ? updatedKeyResult : kr
      ))
      
      showSuccess('进度已更新', `关键结果"${keyResult.title}"的进度已更新`)
    } catch (error) {
      handleApiError(error, '更新进度失败')
    }
  }

  // 清除过滤器
  const handleClearFilters = () => {
    setFilter({})
    setSearchQuery('')
    setSelectedObjectiveId('')
    setSortBy('created_at')
  }

  // 获取目标名称
  const getObjectiveName = (objectiveId: string) => {
    const objective = objectives.find(obj => obj.id === objectiveId)
    return objective?.title || '未知目标'
  }

  // 获取目标的关键结果统计
  const getObjectiveStats = (objectiveId: string) => {
    const objectiveKeyResults = keyResults.filter(kr => kr.objectiveId === objectiveId)
    const completed = objectiveKeyResults.filter(kr => kr.status === KeyResultStatus.COMPLETED).length
    const total = objectiveKeyResults.length
    const avgProgress = total > 0 ? Math.round(objectiveKeyResults.reduce((sum, kr) => sum + kr.progress, 0) / total) : 0

    return { total, completed, avgProgress }
  }

  // 加载状态
  if (isInitialLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载关键结果数据中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">关键结果管理</h1>
        <button
          onClick={handleCreateKeyResult}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          创建关键结果
        </button>
      </div>

      {/* 搜索和过滤器 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索关键结果</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索关键结果标题或描述..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* 目标选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择目标</label>
            <select
              value={selectedObjectiveId}
              onChange={(e) => setSelectedObjectiveId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部目标</option>
              {objectives.map(objective => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as KeyResultStatus || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部状态</option>
              <option value={KeyResultStatus.NOT_STARTED}>未开始</option>
              <option value={KeyResultStatus.IN_PROGRESS}>进行中</option>
              <option value={KeyResultStatus.COMPLETED}>已完成</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as KeyResultType || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部类型</option>
              <option value={KeyResultType.NUMERIC}>数值型</option>
              <option value={KeyResultType.PERCENTAGE}>百分比型</option>
              <option value={KeyResultType.BOOLEAN}>布尔型</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="created_at">创建时间</option>
              <option value="updated_at">更新时间</option>
              <option value="due_date">截止日期</option>
              <option value="progress">进度</option>
              <option value="title">标题</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              清除过滤
            </button>
          </div>
        </div>

        {/* 加载指示器 */}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">更新中...</span>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">总关键结果数</h3>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">进行中</h3>
          <p className="text-2xl font-bold text-blue-600">
            {keyResults.filter(kr => kr.status === KeyResultStatus.IN_PROGRESS).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">已完成</h3>
          <p className="text-2xl font-bold text-green-600">
            {keyResults.filter(kr => kr.status === KeyResultStatus.COMPLETED).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">平均进度</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) / keyResults.length || 0)}%
          </p>
        </div>
      </div>

      {/* 关键结果列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {keyResults.map(keyResult => {
          const stats = getObjectiveStats(keyResult.objectiveId)
          return (
            <div key={keyResult.id}>
              {/* 目标信息 */}
              <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {getObjectiveName(keyResult.objectiveId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.completed}/{stats.total} 个关键结果已完成 • 平均进度 {stats.avgProgress}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">完成率</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
              <KeyResultCard
                keyResult={keyResult}
                onEdit={handleEditKeyResult}
                onDelete={handleDeleteKeyResult}
                onUpdateProgress={handleUpdateProgress}
              />
            </div>
          )
        })}
        
        {keyResults.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📊</div>
            <p className="text-gray-500">
              {searchQuery || Object.keys(filter).some(key => filter[key as keyof typeof filter]) || selectedObjectiveId
                ? '没有找到符合条件的关键结果' 
                : '还没有任何关键结果'
              }
            </p>
            <button
              onClick={handleCreateKeyResult}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建第一个关键结果
            </button>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => {
              const newPage = Math.max(1, pagination.page - 1)
              setPagination(prev => ({ ...prev, page: newPage }))
              loadKeyResults({ page: newPage })
            }}
            disabled={pagination.page <= 1 || isLoading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </span>
          
          <button
            onClick={() => {
              const newPage = Math.min(pagination.totalPages, pagination.page + 1)
              setPagination(prev => ({ ...prev, page: newPage }))
              loadKeyResults({ page: newPage })
            }}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 关键结果表单弹窗 */}
      <KeyResultForm
        keyResult={editingKeyResult || undefined}
        objectiveId={selectedObjectiveId}
        objectives={objectives}
        isOpen={showKeyResultForm}
        onClose={() => {
          setShowKeyResultForm(false)
          setEditingKeyResult(null)
        }}
        onSubmit={handleSubmitKeyResult}
        isLoading={isLoading}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="确认删除关键结果"
        message={`确定要删除关键结果"${deletingKeyResult?.title}"吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteKeyResult}
        onCancel={() => {
          setShowDeleteDialog(false)
          setDeletingKeyResult(null)
        }}
        type="danger"
        isLoading={isLoading}
      />
    </div>
  )
} 