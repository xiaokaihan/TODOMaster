import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { System, Objective, Task, TaskStatus, CreateObjectiveDto, UpdateObjectiveDto, CreateTaskDto, UpdateTaskDto } from '@shared/types'
import ObjectiveForm from '../components/ObjectiveForm'
import TaskForm from '../components/TaskForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { SystemService } from '../services/systemService'
import { ObjectiveService } from '../services/objectiveService'
import { showSuccess, handleApiError } from '../utils/notification'
import { formatDate, getTaskStatusLabel, getPriorityLabel, getPriorityColor } from '@shared/utils'

interface ObjectiveWithTasks extends Objective {
  tasks: Task[]
  taskCount: number
  completedTaskCount: number
  keyResultCount: number
}

const SystemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [system, setSystem] = useState<(System & { totalTasks?: number; completedTasks?: number; inProgressTasks?: number }) | null>(null)
  const [objectives, setObjectives] = useState<ObjectiveWithTasks[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 展开/折叠的目标
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set())

  // 目标表单
  const [showObjectiveForm, setShowObjectiveForm] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)

  // 任务表单
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [taskObjectiveId, setTaskObjectiveId] = useState<string>('')

  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'objective' | 'task'; id: string; title: string } | null>(null)

  // 任务状态更新中
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const loadSystemDetail = useCallback(async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const data = await SystemService.getSystem(id)
      setSystem(data.system)
      setObjectives(data.objectives)
      // 默认展开所有有任务的目标
      const withTasks = new Set<string>()
      data.objectives.forEach((obj: ObjectiveWithTasks) => {
        if (obj.tasks && obj.tasks.length > 0) {
          withTasks.add(obj.id)
        }
      })
      setExpandedObjectives(prev => {
        // 保留已展开的，合并新的
        const merged = new Set(prev)
        withTasks.forEach(id => merged.add(id))
        return merged
      })
    } catch (error) {
      handleApiError(error, '加载系统详情失败')
      navigate('/systems')
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadSystemDetail()
  }, [loadSystemDetail])

  // 切换目标展开状态
  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev)
      if (next.has(objectiveId)) {
        next.delete(objectiveId)
      } else {
        next.add(objectiveId)
      }
      return next
    })
  }

  // 目标操作
  const handleCreateObjective = async (data: CreateObjectiveDto) => {
    try {
      await ObjectiveService.createObjective({ ...data, systemId: id! })
      await loadSystemDetail()
      setShowObjectiveForm(false)
      showSuccess('目标创建成功', '新目标已添加到当前系统', 2000)
    } catch (error) {
      handleApiError(error, '创建目标失败')
    }
  }

  const handleUpdateObjective = async (data: UpdateObjectiveDto) => {
    if (!editingObjective) return
    try {
      await ObjectiveService.updateObjective(editingObjective.id, data)
      await loadSystemDetail()
      setShowObjectiveForm(false)
      setEditingObjective(null)
      showSuccess('目标更新成功', '', 2000)
    } catch (error) {
      handleApiError(error, '更新目标失败')
    }
  }

  // 任务操作
  const handleCreateTask = async (data: CreateTaskDto | UpdateTaskDto) => {
    try {
      const taskService = await import('../services/taskService')
      const svc = new taskService.TaskService()
      await svc.createTask(data as CreateTaskDto)
      await loadSystemDetail()
      setShowTaskForm(false)
      setTaskObjectiveId('')
      showSuccess('任务创建成功', '', 2000)
    } catch (error) {
      handleApiError(error, '创建任务失败')
    }
  }

  const handleUpdateTask = async (data: CreateTaskDto | UpdateTaskDto) => {
    if (!editingTask) return
    try {
      const taskService = await import('../services/taskService')
      const svc = new taskService.TaskService()
      await svc.updateTask(editingTask.id, data as UpdateTaskDto)
      await loadSystemDetail()
      setShowTaskForm(false)
      setEditingTask(undefined)
      showSuccess('任务更新成功', '', 2000)
    } catch (error) {
      handleApiError(error, '更新任务失败')
    }
  }

  // 快速切换任务状态
  const handleToggleTaskStatus = async (task: Task) => {
    setUpdatingTaskId(task.id)
    try {
      const taskService = await import('../services/taskService')
      const svc = new taskService.TaskService()
      const nextStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO :
                         task.status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS :
                         task.status === TaskStatus.IN_PROGRESS ? TaskStatus.COMPLETED : task.status
      await svc.updateTaskStatus(task.id, nextStatus)
      await loadSystemDetail()
    } catch (error) {
      handleApiError(error, '更新任务状态失败')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // 删除操作
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'objective') {
        await ObjectiveService.deleteObjective(deleteTarget.id)
      } else {
        const taskService = await import('../services/taskService')
        const svc = new taskService.TaskService()
        await svc.deleteTask(deleteTarget.id)
      }
      await loadSystemDetail()
      setShowDeleteDialog(false)
      setDeleteTarget(null)
      showSuccess(`${deleteTarget.type === 'objective' ? '目标' : '任务'}已删除`, '', 2000)
    } catch (error) {
      handleApiError(error, '删除失败')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      DRAFT: { text: '草稿', className: 'bg-gray-100 text-gray-700' },
      ACTIVE: { text: '进行中', className: 'bg-blue-100 text-blue-700' },
      ON_HOLD: { text: '暂停', className: 'bg-yellow-100 text-yellow-700' },
      COMPLETED: { text: '已完成', className: 'bg-green-100 text-green-700' },
      CANCELLED: { text: '已取消', className: 'bg-red-100 text-red-700' }
    }
    const badge = badges[status] || badges.DRAFT
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>{badge.text}</span>
  }

  const getTaskCheckStyle = (status: TaskStatus) => {
    if (status === TaskStatus.COMPLETED) return 'bg-green-500 border-green-500 text-white'
    if (status === TaskStatus.IN_PROGRESS) return 'border-blue-400 bg-blue-100'
    return 'border-gray-300 bg-white'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">加载系统详情中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!system) return null

  const totalTasks = system.totalTasks || 0
  const completedTasks = system.completedTasks || 0
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 面包屑 */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link to="/systems" className="hover:text-blue-600 transition-colors">我的系统</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{system.icon} {system.name}</span>
      </nav>

      {/* 系统头部概览 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${system.color || '#6366F1'}15` }}
            >
              {system.icon || '📋'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
              {system.description && (
                <p className="text-gray-500 mt-1">{system.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => { setEditingObjective(null); setShowObjectiveForm(true) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + 添加目标
          </button>
        </div>

        {/* 统计行 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{system.objectiveCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">总目标</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{system.activeObjectiveCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">进行中</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            <p className="text-xs text-gray-500 mt-1">已完成任务</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalTasks}</p>
            <p className="text-xs text-gray-500 mt-1">总任务</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${taskProgress}%`, backgroundColor: system.color || '#6366F1' }}
                />
              </div>
              <span className="text-2xl font-bold" style={{ color: system.color || '#6366F1' }}>{taskProgress}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">完成率</p>
          </div>
        </div>
      </div>

      {/* 目标 + 任务层级 */}
      {objectives.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无目标</h3>
          <p className="text-gray-500 mb-6">为这个系统创建第一个目标，然后添加任务来推进目标</p>
          <button
            onClick={() => { setEditingObjective(null); setShowObjectiveForm(true) }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建目标
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj) => {
            const isExpanded = expandedObjectives.has(obj.id)
            const objTaskCount = obj.taskCount || 0
            const objCompletedCount = obj.completedTaskCount || 0
            const objProgress = objTaskCount > 0 ? Math.round((objCompletedCount / objTaskCount) * 100) : 0
            const tasks = obj.tasks || []

            return (
              <div
                key={obj.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* 目标头部 */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleObjective(obj.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 mr-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{obj.title}</h3>
                          {getStatusBadge(obj.status)}
                        </div>
                        {obj.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">{obj.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                      {/* 任务进度 */}
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${objProgress}%`, backgroundColor: system.color || '#6366F1' }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-20 text-right">
                          {objCompletedCount}/{objTaskCount} 任务
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setTaskObjectiveId(obj.id)
                            setEditingTask(undefined)
                            setShowTaskForm(true)
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="添加任务"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setEditingObjective(obj as any); setShowObjectiveForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="编辑目标"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setDeleteTarget({ type: 'objective', id: obj.id, title: obj.title }); setShowDeleteDialog(true) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除目标"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 任务列表 - 可折叠 */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {tasks.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-gray-400 mb-2">暂无任务</p>
                        <button
                          onClick={() => {
                            setTaskObjectiveId(obj.id)
                            setEditingTask(undefined)
                            setShowTaskForm(true)
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + 添加第一个任务
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {tasks.map((task: any) => (
                          <div
                            key={task.id}
                            className={`flex items-center px-5 py-3 hover:bg-gray-50 transition-colors group ${
                              task.status === TaskStatus.CANCELLED ? 'opacity-50' : ''
                            }`}
                          >
                            {/* 状态复选框 */}
                            <button
                              onClick={() => handleToggleTaskStatus(task)}
                              disabled={updatingTaskId === task.id}
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                getTaskCheckStyle(task.status)
                              } ${updatingTaskId === task.id ? 'animate-pulse' : ''}`}
                              title={`当前: ${getTaskStatusLabel(task.status)} - 点击切换`}
                            >
                              {task.status === TaskStatus.COMPLETED && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {task.status === TaskStatus.IN_PROGRESS && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </button>

                            {/* 任务信息 */}
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  task.status === TaskStatus.COMPLETED
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </span>
                                {task.status === TaskStatus.IN_PROGRESS && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
                                    进行中
                                  </span>
                                )}
                                {task.status === TaskStatus.WAITING && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded">
                                    等待中
                                  </span>
                                )}
                              </div>
                              {/* 任务元信息 */}
                              <div className="flex items-center space-x-3 mt-0.5">
                                {task.priority && task.priority !== 'MEDIUM' && (
                                  <span
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                  >
                                    {getPriorityLabel(task.priority)}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className={`text-xs ${
                                    new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED
                                      ? 'text-red-500 font-medium'
                                      : 'text-gray-400'
                                  }`}>
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 操作按钮 - hover 显示 */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingTask(task)
                                  setTaskObjectiveId(task.objectiveId)
                                  setShowTaskForm(true)
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                title="编辑"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: 'task', id: task.id, title: task.title })
                                  setShowDeleteDialog(true)
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="删除"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* 底部快捷添加 */}
                        <div className="px-5 py-2">
                          <button
                            onClick={() => {
                              setTaskObjectiveId(obj.id)
                              setEditingTask(undefined)
                              setShowTaskForm(true)
                            }}
                            className="flex items-center text-sm text-gray-400 hover:text-blue-600 transition-colors py-1"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            添加任务
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 目标表单 */}
      <ObjectiveForm
        objective={editingObjective || undefined}
        isOpen={showObjectiveForm}
        onClose={() => { setShowObjectiveForm(false); setEditingObjective(null) }}
        onSubmit={(data) => editingObjective ? handleUpdateObjective(data as UpdateObjectiveDto) : handleCreateObjective(data as CreateObjectiveDto)}
        defaultSystemId={id}
      />

      {/* 任务表单 */}
      <TaskForm
        task={editingTask}
        isOpen={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditingTask(undefined); setTaskObjectiveId('') }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        objectives={taskObjectiveId ? objectives.filter(o => o.id === taskObjectiveId) : objectives}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={`确认删除${deleteTarget?.type === 'objective' ? '目标' : '任务'}`}
        message={
          deleteTarget?.type === 'objective'
            ? `确定要删除目标"${deleteTarget.title}"吗？此操作将同时删除相关的任务，且无法撤销。`
            : `确定要删除任务"${deleteTarget?.title}"吗？此操作无法撤销。`
        }
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteDialog(false); setDeleteTarget(null) }}
        type="danger"
      />
    </div>
  )
}

export default SystemDetail
