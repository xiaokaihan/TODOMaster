import React, { useState, useEffect } from 'react'
import { Objective, ObjectiveCategory, Priority, ObjectiveStatus, KeyResult, CreateObjectiveDto, UpdateObjectiveDto, CreateKeyResultDto, UpdateKeyResultDto } from '@shared/types'
import ObjectiveCard from '../components/ObjectiveCard'
import ObjectiveForm from '../components/ObjectiveForm'
import KeyResultForm from '../components/KeyResultForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { KeyResultCard } from '../components/KeyResultCard'
import { ObjectiveService, ObjectiveListParams } from '../services/objectiveService'
import { KeyResultService, updateKeyResultProgress } from '../services/keyResultService'
import { showSuccess, handleApiError } from '../utils/notification'

const Objectives: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<Record<string, KeyResult[]>>({})
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const [filter, setFilter] = useState<{
    status?: ObjectiveStatus
    category?: ObjectiveCategory
    priority?: Priority
  }>({})

  // 新增状态
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'startDate' | 'targetDate' | 'progress'>('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showObjectiveForm, setShowObjectiveForm] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingObjectiveId, setDeletingObjectiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 关键结果相关状态
  const [showKeyResultForm, setShowKeyResultForm] = useState(false)
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(null)
  const [keyResultObjectiveId, setKeyResultObjectiveId] = useState<string>('')
  const [showDeleteKeyResultDialog, setShowDeleteKeyResultDialog] = useState(false)
  const [deletingKeyResult, setDeletingKeyResult] = useState<KeyResult | null>(null)

  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // 加载目标列表
  const loadObjectives = async (params: ObjectiveListParams = {}) => {
    try {
      setIsLoading(true)

      const queryParams: ObjectiveListParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        category: filter.category,
        status: filter.status,
        priority: filter.priority,
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...params
      }

      const response = await ObjectiveService.getObjectives(queryParams)
      if (response) {
        setObjectives(response.data)
        setPagination(response.pagination)

        // 提取关键结果
        const keyResultsMap: Record<string, KeyResult[]> = {}
        response.data.forEach((obj: Objective) => {
          if (obj.keyResults) {
            keyResultsMap[obj.id] = obj.keyResults
          }
        })
        setKeyResults(keyResultsMap)
        console.log('设置objectives:', response.data)
      }
    } catch (error) {
      handleApiError(error, '加载目标列表失败')
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadObjectives()
  }, [])

  // 搜索和过滤变化时重新加载
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
      loadObjectives({ page: 1 })
    }, 300) // 防抖

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filter, sortBy, sortOrder])

  // 过滤和搜索目标（现在主要用于客户端排序和显示）
  const filteredAndSortedObjectives = objectives
    .filter((objective) => {
      if (!searchQuery && !filter.status && !filter.category && !filter.priority) {
        return true;
      }

      const matchesSearch = !searchQuery || (
        objective.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (objective.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );

      const matchesStatus = !filter.status || objective.status === filter.status;
      const matchesCategory = !filter.category || objective.category === filter.category;
      const matchesPriority = !filter.priority || objective.priority === filter.priority;

      const result = matchesSearch && matchesStatus && matchesCategory && matchesPriority;
      return result;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { [Priority.CRITICAL]: 4, [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
          aValue = priorityOrder[a.priority || Priority.LOW] || 0;
          bValue = priorityOrder[b.priority || Priority.LOW] || 0;
          break;
        case 'startDate':
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case 'targetDate':
          aValue = a.targetDate ? new Date(a.targetDate).getTime() : 0;
          bValue = b.targetDate ? new Date(b.targetDate).getTime() : 0;
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        default:
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
      }

      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

  const handleCreateObjective = async (data: CreateObjectiveDto) => {
    setIsLoading(true)
    try {
      const newObjective = await ObjectiveService.createObjective(data)

      // 重新加载列表以获取最新数据
      await loadObjectives()

      setShowObjectiveForm(false)
      showSuccess('目标创建成功', `目标"${newObjective.title}"已成功创建`, 2000)
    } catch (error) {
      handleApiError(error, '创建目标失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateObjective = async (data: UpdateObjectiveDto) => {
    if (!editingObjective) return

    setIsLoading(true)
    try {
      const updatedObjective = await ObjectiveService.updateObjective(editingObjective.id, data)

      // 更新本地状态
      setObjectives(prev => prev.map(obj =>
        obj.id === editingObjective.id ? updatedObjective : obj
      ))

      setShowObjectiveForm(false)
      setEditingObjective(null)
      showSuccess('目标更新成功', `目标"${updatedObjective.title}"已成功更新`, 2000)
    } catch (error) {
      handleApiError(error, '更新目标失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective)
    setShowObjectiveForm(true)
  }

  const handleDeleteObjective = (id: string) => {
    setDeletingObjectiveId(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteObjective = async () => {
    if (!deletingObjectiveId) return

    setIsLoading(true)
    try {
      await ObjectiveService.deleteObjective(deletingObjectiveId)

      // 更新本地状态
      setObjectives(prev => prev.filter(obj => obj.id !== deletingObjectiveId))

      // 同时删除相关的关键结果
      setKeyResults(prev => {
        const newKeyResults = { ...prev }
        delete newKeyResults[deletingObjectiveId]
        return newKeyResults
      })

      setShowDeleteDialog(false)
      setDeletingObjectiveId(null)
      showSuccess('目标删除成功', '目标及相关数据已被删除', 2000)
    } catch (error) {
      handleApiError(error, '删除目标失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewTasks = async (objective: Objective) => {
    try {
      // 获取完整的目标详情（包含关键结果和任务）
      const fullObjective = await ObjectiveService.getObjective(objective.id)
      setSelectedObjective(fullObjective)

      // 更新关键结果数据
      if (fullObjective.keyResults) {
        setKeyResults(prev => ({
          ...prev,
          [fullObjective.id]: fullObjective.keyResults || []
        }))
      }
    } catch (error) {
      handleApiError(error, '加载目标详情失败')
    }
  }

  const handleUpdateKeyResult = async (keyResult: KeyResult, newValue: number) => {
    try {
      const updatedKeyResult = await updateKeyResultProgress(keyResult.id, newValue)

      // 更新本地状态
      setKeyResults(prev => {
        const newKeyResults = { ...prev }
        Object.keys(newKeyResults).forEach(objId => {
          newKeyResults[objId] = newKeyResults[objId].map(kr =>
            kr.id === keyResult.id ? updatedKeyResult : kr
          )
        })
        return newKeyResults
      })

      showSuccess('关键结果已更新', `进度已更新为 ${newValue}`, 2000)
    } catch (error) {
      handleApiError(error, '更新关键结果失败')
    }
  }

  // 关键结果管理函数
  const handleCreateKeyResult = (objectiveId: string) => {
    setKeyResultObjectiveId(objectiveId)
    setEditingKeyResult(null)
    setShowKeyResultForm(true)
  }

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditingKeyResult(keyResult)
    setKeyResultObjectiveId(keyResult.objectiveId)
    setShowKeyResultForm(true)
  }

  const handleDeleteKeyResult = (keyResult: KeyResult) => {
    setDeletingKeyResult(keyResult)
    setShowDeleteKeyResultDialog(true)
  }

  const handleSubmitKeyResult = async (data: CreateKeyResultDto | UpdateKeyResultDto) => {
    setIsLoading(true)
    try {
      if (editingKeyResult) {
        // 更新关键结果
        const updatedKeyResult = await KeyResultService.updateKeyResult(editingKeyResult.id, data as UpdateKeyResultDto)

        // 更新本地状态
        setKeyResults(prev => {
          const newKeyResults = { ...prev }
          Object.keys(newKeyResults).forEach(objId => {
            newKeyResults[objId] = newKeyResults[objId].map(kr =>
              kr.id === editingKeyResult.id ? updatedKeyResult : kr
            )
          })
          return newKeyResults
        })

        showSuccess('关键结果更新成功', `关键结果"${updatedKeyResult.title}"已成功更新`, 2000)
      } else {
        // 创建关键结果
        const newKeyResult = await KeyResultService.createKeyResult(data as CreateKeyResultDto)

        // 更新本地状态
        setKeyResults(prev => ({
          ...prev,
          [keyResultObjectiveId]: [
            ...(prev[keyResultObjectiveId] || []),
            newKeyResult
          ]
        }))

        showSuccess('关键结果创建成功', `关键结果"${newKeyResult.title}"已成功创建`, 2000)
      }

      setShowKeyResultForm(false)
      setEditingKeyResult(null)
      setKeyResultObjectiveId('')
    } catch (error) {
      handleApiError(error, editingKeyResult ? '更新关键结果失败' : '创建关键结果失败')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteKeyResult = async () => {
    if (!deletingKeyResult) return

    setIsLoading(true)
    try {
      await KeyResultService.deleteKeyResult(deletingKeyResult.id)

      // 更新本地状态
      setKeyResults(prev => {
        const newKeyResults = { ...prev }
        Object.keys(newKeyResults).forEach(objId => {
          newKeyResults[objId] = newKeyResults[objId].filter(kr => kr.id !== deletingKeyResult.id)
        })
        return newKeyResults
      })

      setShowDeleteKeyResultDialog(false)
      setDeletingKeyResult(null)
      showSuccess('关键结果删除成功', '关键结果已被删除', 2000)
    } catch (error) {
      handleApiError(error, '删除关键结果失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFilters = () => {
    setFilter({})
    setSearchQuery('')
    setSortBy('startDate')
    setSortOrder('desc')
  }

  const deletingObjectiveTitle = deletingObjectiveId
    ? objectives.find(obj => obj.id === deletingObjectiveId)?.title
    : ''

  // 加载状态
  if (isInitialLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载目标数据中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">目标管理</h1>
        <button
          onClick={() => setShowObjectiveForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          创建目标
        </button>
      </div>

      {/* 搜索和排序 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索目标</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索目标标题或描述..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* 排序 */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="startDate">开始日期</option>
                <option value="targetDate">目标日期</option>
                <option value="title">标题</option>
                <option value="priority">优先级</option>
                <option value="progress">完成进度</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序顺序</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as ObjectiveStatus || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部状态</option>
              <option value={ObjectiveStatus.DRAFT}>草稿</option>
              <option value={ObjectiveStatus.ACTIVE}>进行中</option>
              <option value={ObjectiveStatus.ON_HOLD}>暂停</option>
              <option value={ObjectiveStatus.COMPLETED}>已完成</option>
              <option value={ObjectiveStatus.CANCELLED}>已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={filter.category || ''}
              onChange={(e) => setFilter({ ...filter, category: e.target.value as ObjectiveCategory || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部分类</option>
              <option value={ObjectiveCategory.PERSONAL}>个人发展</option>
              <option value={ObjectiveCategory.PROFESSIONAL}>职业发展</option>
              <option value={ObjectiveCategory.HEALTH}>健康生活</option>
              <option value={ObjectiveCategory.LEARNING}>学习成长</option>
              <option value={ObjectiveCategory.FINANCIAL}>财务规划</option>
              <option value={ObjectiveCategory.RELATIONSHIP}>人际关系</option>
              <option value={ObjectiveCategory.CREATIVE}>创意项目</option>
              <option value={ObjectiveCategory.OTHER}>其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              value={filter.priority || ''}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value as Priority || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">全部优先级</option>
              <option value={Priority.LOW}>低</option>
              <option value={Priority.MEDIUM}>中</option>
              <option value={Priority.HIGH}>高</option>
              <option value={Priority.CRITICAL}>紧急</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            清除过滤
          </button>
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
          <h3 className="text-sm font-medium text-gray-500">总目标数</h3>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">进行中</h3>
          <p className="text-2xl font-bold text-blue-600">
            {objectives.filter(obj => obj.status === ObjectiveStatus.ACTIVE).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">已完成</h3>
          <p className="text-2xl font-bold text-green-600">
            {objectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">平均进度</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / objectives.length || 0)}%
          </p>
        </div>
      </div>

      {/* 目标详情弹窗 */}
      {selectedObjective && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedObjective.title} - 关键结果
                </h2>
                <button
                  onClick={() => setSelectedObjective(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">关键结果</h3>
                  <button
                    onClick={() => handleCreateKeyResult(selectedObjective.id)}
                    className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                  >
                    添加关键结果
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(keyResults[selectedObjective.id] || []).map(keyResult => (
                    <KeyResultCard
                      key={keyResult.id}
                      keyResult={keyResult}
                      onEdit={handleEditKeyResult}
                      onDelete={handleDeleteKeyResult}
                      onUpdateProgress={handleUpdateKeyResult}
                    />
                  ))}

                  {/* 空状态 */}
                  {(!keyResults[selectedObjective.id] || keyResults[selectedObjective.id].length === 0) && (
                    <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <div className="text-gray-400 text-2xl mb-2">📊</div>
                      <div className="text-sm text-gray-600 mb-3">还没有任何关键结果</div>
                      <button
                        onClick={() => handleCreateKeyResult(selectedObjective.id)}
                        className="text-blue-600 text-sm hover:text-blue-700"
                        disabled={isLoading}
                      >
                        创建第一个关键结果
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">相关任务</h3>
                <div className="space-y-2">
                  {selectedObjective.tasks?.map(task => (
                    <div key={task.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{task.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {task.status === 'COMPLETED' ? '已完成' : '进行中'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                    </div>
                  )) || <p className="text-gray-500">暂无相关任务</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 目标列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedObjectives.map(objective => (
          <ObjectiveCard
            key={objective.id}
            objective={objective}
            onEdit={handleEditObjective}
            onDelete={handleDeleteObjective}
            onViewTasks={handleViewTasks}
          />
        ))}

        {filteredAndSortedObjectives.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-500">
              {searchQuery || Object.keys(filter).some(key => filter[key as keyof typeof filter])
                ? '没有找到符合条件的目标'
                : '还没有任何目标'
              }
            </p>
            <button
              onClick={() => setShowObjectiveForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建第一个目标
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
              loadObjectives({ page: newPage })
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
              loadObjectives({ page: newPage })
            }}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 目标表单弹窗 */}
      <ObjectiveForm
        objective={editingObjective || undefined}
        isOpen={showObjectiveForm}
        onClose={() => {
          setShowObjectiveForm(false)
          setEditingObjective(null)
        }}
        onSubmit={(data) => editingObjective ? handleUpdateObjective(data as UpdateObjectiveDto) : handleCreateObjective(data as CreateObjectiveDto)}
        isLoading={isLoading}
      />

      {/* 关键结果表单弹窗 */}
      <KeyResultForm
        keyResult={editingKeyResult || undefined}
        objectiveId={keyResultObjectiveId}
        objectives={objectives}
        isOpen={showKeyResultForm}
        onClose={() => {
          setShowKeyResultForm(false)
          setEditingKeyResult(null)
          setKeyResultObjectiveId('')
        }}
        onSubmit={handleSubmitKeyResult}
        isLoading={isLoading}
      />

      {/* 删除目标确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="确认删除目标"
        message={`确定要删除目标"${deletingObjectiveTitle}"吗？此操作将同时删除相关的关键结果和任务，且无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteObjective}
        onCancel={() => {
          setShowDeleteDialog(false)
          setDeletingObjectiveId(null)
        }}
        type="danger"
        isLoading={isLoading}
      />

      {/* 删除关键结果确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteKeyResultDialog}
        title="确认删除关键结果"
        message={`确定要删除关键结果"${deletingKeyResult?.title}"吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteKeyResult}
        onCancel={() => {
          setShowDeleteKeyResultDialog(false)
          setDeletingKeyResult(null)
        }}
        type="danger"
        isLoading={isLoading}
      />
    </div>
  )
}

export default Objectives 