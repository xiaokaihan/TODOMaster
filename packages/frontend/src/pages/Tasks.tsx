import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Task, TaskStatus, Priority, Objective, System } from '@shared/types'
import TaskCard from '../components/TaskCard'
import { TaskService } from '../services/taskService'
import { ObjectiveService } from '../services/objectiveService'
import { SystemService } from '../services/systemService'
import TaskForm from '../components/TaskForm'
import { CreateTaskDto, UpdateTaskDto } from '@shared/types'
import { showSuccess, handleApiError } from '../utils/notification'

const Tasks: React.FC = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<{
    status?: TaskStatus
    priority?: Priority
    objectiveId?: string
    systemId?: string
    search?: string
  }>({})
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  // 获取系统列表（用于筛选）
  const { data: systemsData } = useQuery(
    'systems',
    () => SystemService.getSystems(),
    { staleTime: 10 * 60 * 1000 }
  )

  // 获取任务列表
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery(
    ['tasks', filter],
    () => TaskService.getTasks({
      status: filter.status,
      priority: filter.priority,
      objectiveId: filter.objectiveId,
      systemId: filter.systemId,
      search: filter.search,
    }),
    { staleTime: 5 * 60 * 1000 }
  )

  // 获取目标列表（用于筛选，根据系统过滤）
  const { data: objectivesData } = useQuery(
    ['objectives', filter.systemId],
    () => ObjectiveService.getObjectives({ limit: 100, systemId: filter.systemId }),
    { staleTime: 10 * 60 * 1000 }
  )

  // 删除任务 mutation
  const deleteTaskMutation = useMutation(
    (id: string) => {
      const taskService = new TaskService()
      return taskService.deleteTask(id)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
        showSuccess('任务删除成功', '任务已成功删除')
      },
      onError: (error: any) => {
        handleApiError(error, '删除任务失败')
      },
    }
  )

  // 更新任务状态 mutation
  const updateTaskStatusMutation = useMutation(
    ({ id, status }: { id: string; status: TaskStatus }) => {
      const taskService = new TaskService()
      return taskService.updateTaskStatus(id, status)
    },
    {
      onSuccess: (task) => {
        queryClient.invalidateQueries('tasks')
        const statusLabels: Record<TaskStatus, string> = {
          [TaskStatus.TODO]: '待办',
          [TaskStatus.IN_PROGRESS]: '进行中',
          [TaskStatus.WAITING]: '等待中',
          [TaskStatus.COMPLETED]: '已完成',
          [TaskStatus.CANCELLED]: '已取消',
        }
        showSuccess('状态更新成功', `任务"${task.title}"已更新为${statusLabels[task.status]}`)
      },
      onError: (error: any) => {
        handleApiError(error, '更新任务状态失败')
      },
    }
  )

  // 创建任务 mutation
  const createTaskMutation = useMutation(
    (data: CreateTaskDto) => {
      const taskService = new TaskService()
      return taskService.createTask(data)
    },
    {
      onSuccess: (task) => {
        queryClient.invalidateQueries('tasks')
        setIsTaskFormOpen(false)
        showSuccess('任务创建成功', `任务"${task.title}"已成功创建`)
      },
      onError: (error: any) => {
        handleApiError(error, '创建任务失败')
      },
    }
  )

  // 更新任务 mutation
  const updateTaskMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateTaskDto }) => {
      const taskService = new TaskService()
      return taskService.updateTask(id, data)
    },
    {
      onSuccess: (task) => {
        queryClient.invalidateQueries('tasks')
        setIsTaskFormOpen(false)
        setEditingTask(undefined)
        showSuccess('任务更新成功', `任务"${task.title}"已成功更新`)
      },
      onError: (error: any) => {
        handleApiError(error, '更新任务失败')
      },
    }
  )

  const tasks: Task[] = tasksData?.tasks || []
  const objectives = objectivesData?.data || []
  const systems = systemsData || []

  // 由于后端已支持所有筛选，直接使用返回的任务
  const filteredTasks = tasks

  // 按状态分组任务
  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter((task: Task) => task.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.WAITING]: filteredTasks.filter((task: Task) => task.status === TaskStatus.WAITING),
    [TaskStatus.COMPLETED]: filteredTasks.filter((task: Task) => task.status === TaskStatus.COMPLETED),
    [TaskStatus.CANCELLED]: filteredTasks.filter((task: Task) => task.status === TaskStatus.CANCELLED),
  }

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setIsTaskFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const handleTaskSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data: data as UpdateTaskDto })
    } else {
      await createTaskMutation.mutateAsync(data as CreateTaskDto)
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        await deleteTaskMutation.mutateAsync(id)
      } catch (error) {
        // 错误已在 mutation 的 onError 中处理
      }
    }
  }

  const handleStartTask = async (id: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id, status: TaskStatus.IN_PROGRESS })
    } catch (error) {
      // 错误已在 mutation 的 onError 中处理
    }
  }

  const handleCompleteTask = async (id: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id, status: TaskStatus.COMPLETED })
    } catch (error) {
      // 错误已在 mutation 的 onError 中处理
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id, status })
    } catch (error) {
      // 错误已在 mutation 的 onError 中处理
    }
  }

  // 加载状态
  if (tasksLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">加载任务中...</span>
        </div>
      </div>
    )
  }

  // 错误状态
  if (tasksError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">加载任务失败</h2>
          <p className="text-red-700 mb-4">{(tasksError as Error).message || '未知错误'}</p>
          <button
            onClick={() => queryClient.invalidateQueries('tasks')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">任务管理</h1>
        <button 
          onClick={handleCreateTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          创建任务
        </button>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属系统</label>
            <select
              value={filter.systemId || ''}
              onChange={(e) => setFilter({ ...filter, systemId: e.target.value || undefined, objectiveId: undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部系统</option>
              {systems.map((system: System) => (
                <option key={system.id} value={system.id}>
                  {system.icon || '📋'} {system.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联目标</label>
            <select
              value={filter.objectiveId || ''}
              onChange={(e) => setFilter({ ...filter, objectiveId: e.target.value || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部目标</option>
              {objectives.map((objective: Objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as TaskStatus || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部状态</option>
              <option value={TaskStatus.TODO}>待办</option>
              <option value={TaskStatus.IN_PROGRESS}>进行中</option>
              <option value={TaskStatus.WAITING}>等待中</option>
              <option value={TaskStatus.COMPLETED}>已完成</option>
              <option value={TaskStatus.CANCELLED}>已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              value={filter.priority || ''}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value as Priority || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部优先级</option>
              <option value={Priority.LOW}>低</option>
              <option value={Priority.MEDIUM}>中</option>
              <option value={Priority.HIGH}>高</option>
              <option value={Priority.CRITICAL}>紧急</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              type="text"
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value || undefined })}
              placeholder="搜索任务标题..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({})}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-300"
            >
              清除过滤
            </button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">总任务数</h3>
            <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
          </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">待办</h3>
          <p className="text-2xl font-bold text-gray-600">
            {tasks.filter(task => task.status === TaskStatus.TODO).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">进行中</h3>
          <p className="text-2xl font-bold text-blue-600">
            {tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">已完成</h3>
          <p className="text-2xl font-bold text-green-600">
            {tasks.filter(task => task.status === TaskStatus.COMPLETED).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">完成率</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round((tasks.filter((task: Task) => task.status === TaskStatus.COMPLETED).length / tasks.length) * 100) || 0}%
          </p>
        </div>
        </div>
      )}

      {/* 空状态 */}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-gray-500 mb-4">暂无任务，开始创建您的第一个任务吧！</p>
          <button 
            onClick={handleCreateTask}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            创建任务
          </button>
        </div>
      )}

      {/* 看板视图 */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 待办列 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
            待办 ({tasksByStatus[TaskStatus.TODO].length})
          </h3>
          <div className="space-y-4">
            {tasksByStatus[TaskStatus.TODO].map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStart={handleStartTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus[TaskStatus.TODO].length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无待办任务
              </div>
            )}
          </div>
        </div>

        {/* 进行中列 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            进行中 ({tasksByStatus[TaskStatus.IN_PROGRESS].length})
          </h3>
          <div className="space-y-4">
            {tasksByStatus[TaskStatus.IN_PROGRESS].map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onComplete={handleCompleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus[TaskStatus.IN_PROGRESS].length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无进行中任务
              </div>
            )}
          </div>
        </div>

        {/* 等待中列 */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            等待中 ({tasksByStatus[TaskStatus.WAITING].length})
          </h3>
          <div className="space-y-4">
            {tasksByStatus[TaskStatus.WAITING].map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStart={handleStartTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus[TaskStatus.WAITING].length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无等待中任务
              </div>
            )}
          </div>
        </div>

        {/* 已完成列 */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            已完成 ({tasksByStatus[TaskStatus.COMPLETED].length})
          </h3>
          <div className="space-y-4">
            {tasksByStatus[TaskStatus.COMPLETED].map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus[TaskStatus.COMPLETED].length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无已完成任务
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* 任务详情信息 */}
      {tasks.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">任务分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">按目标分组</h4>
            <div className="space-y-2">
              {objectives.map((objective: Objective) => {
                const objectiveTasks = tasks.filter((task: Task) => task.objectiveId === objective.id)
                const completedCount = objectiveTasks.filter((task: Task) => task.status === TaskStatus.COMPLETED).length
                const progress = objectiveTasks.length > 0 ? Math.round((completedCount / objectiveTasks.length) * 100) : 0
                
                return (
                  <div key={objective.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 truncate">{objective.title}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{completedCount}/{objectiveTasks.length}</span>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">逾期任务</h4>
            <div className="space-y-2">
              {tasks.filter((task: Task) => 
                task.dueDate && 
                new Date(task.dueDate) < new Date() && 
                task.status !== TaskStatus.COMPLETED
              ).map((task: Task) => (
                <div key={task.id} className="p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-700">{task.title}</span>
                  <div className="text-xs text-red-500">
                    逾期 {Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))} 天
                  </div>
                </div>
              ))}
              {tasks.filter(task => 
                task.dueDate && 
                new Date(task.dueDate) < new Date() && 
                task.status !== TaskStatus.COMPLETED
              ).length === 0 && (
                <div className="text-sm text-gray-500">暂无逾期任务</div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">即将到期</h4>
            <div className="space-y-2">
              {tasks.filter((task: Task) => {
                if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
                const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysLeft > 0 && daysLeft <= 7
              }).map((task: Task) => (
                <div key={task.id} className="p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-yellow-700">{task.title}</span>
                  <div className="text-xs text-yellow-600">
                    还剩 {Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 天
                  </div>
                </div>
              ))}
              {tasks.filter(task => {
                if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
                const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysLeft > 0 && daysLeft <= 7
              }).length === 0 && (
                <div className="text-sm text-gray-500">暂无即将到期任务</div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 任务表单对话框 */}
      <TaskForm
        task={editingTask}
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false)
          setEditingTask(undefined)
        }}
        onSubmit={handleTaskSubmit}
        isLoading={createTaskMutation.isLoading || updateTaskMutation.isLoading}
        objectives={objectives}
      />
    </div>
  )
}

export default Tasks 