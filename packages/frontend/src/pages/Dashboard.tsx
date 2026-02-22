import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Objective, Task, System, ObjectiveStatus, TaskStatus, KeyResult, KeyResultType, KeyResultStatus } from '@shared/types'
import { formatDate, formatDateTime, getObjectiveStatusLabel, getTaskStatusLabel } from '@shared/utils'
import ObjectiveCard from '../components/ObjectiveCard'
import TaskCard from '../components/TaskCard'
import { KeyResultCard } from '../components/KeyResultCard'
import { getDashboardStats } from '../services/statsService'
import { ObjectiveService } from '../services/objectiveService'
import { SystemService } from '../services/systemService'
import { TaskService } from '../services/taskService'
import { KeyResultService } from '../services/keyResultService'
import { useMutation, useQueryClient } from 'react-query'
import TaskForm from '../components/TaskForm'
import ObjectiveForm from '../components/ObjectiveForm'
import { CreateTaskDto, UpdateTaskDto, CreateObjectiveDto, UpdateObjectiveDto } from '@shared/types'
import { showSuccess, handleApiError } from '../utils/notification'

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedView, setSelectedView] = useState<'overview' | 'objectives' | 'tasks' | 'keyResults'>('overview')
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isObjectiveFormOpen, setIsObjectiveFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [editingObjective, setEditingObjective] = useState<Objective | undefined>()

  // 获取统计数据
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery(
    'dashboardStats',
    () => getDashboardStats(),
    { staleTime: 5 * 60 * 1000 } // 5分钟缓存
  )

  // 获取目标列表
  const { data: objectivesData, isLoading: objectivesLoading, error: objectivesError } = useQuery(
    'objectives',
    () => ObjectiveService.getObjectives({ limit: 10 }),
    { staleTime: 5 * 60 * 1000 }
  )

  // 获取任务列表
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery(
    'tasks',
    () => TaskService.getTasks({ limit: 20 }),
    { staleTime: 5 * 60 * 1000 }
  )

  // 获取关键结果列表
  const { data: keyResultsData, isLoading: keyResultsLoading, error: keyResultsError } = useQuery(
    'keyResults',
    () => KeyResultService.getKeyResults({ limit: 10 }),
    { staleTime: 5 * 60 * 1000 }
  )

  // 获取系统列表
  const { data: systemsData } = useQuery(
    'systems',
    () => SystemService.getSystems(),
    { staleTime: 5 * 60 * 1000 }
  )

  // 处理数据
  const objectives = objectivesData?.data || []
  const tasks = tasksData?.tasks || []
  const keyResults = keyResultsData?.data || []
  const systems: System[] = systemsData || []
  const overview = statsData?.overview

  // 计算统计数据
  const stats = overview ? {
    totalObjectives: overview.objectives?.total || 0,
    activeObjectives: overview.objectives?.active || 0,
    completedObjectives: overview.objectives?.completed || 0,
    totalTasks: overview.tasks?.total || 0,
    todoTasks: tasks.filter((task: Task) => task.status === TaskStatus.TODO).length,
    inProgressTasks: overview.tasks?.active || 0,
    completedTasks: overview.tasks?.completed || 0,
    overdueTasks: overview.tasks?.overdue || 0,
    avgProgress: Math.round(overview.productivity?.avgObjectiveProgress || 0),
    productivityScore: Math.round(overview.productivity?.avgObjectiveProgress || 0),
  } : {
    totalObjectives: 0,
    activeObjectives: 0,
    completedObjectives: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    avgProgress: 0,
    productivityScore: 0,
  }

  // 今日任务
  const todayTasks = tasks.filter((task: Task) => {
    if (!task.dueDate) return false
    const today = new Date()
    const taskDate = new Date(task.dueDate)
    return taskDate.toDateString() === today.toDateString()
  })

  // 即将到期的任务
  const upcomingTasks = tasks.filter((task: Task) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
    const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 7
  })

  // 最近活动（简化版，后续可以从 activity_logs API 获取）
  const recentActivities = [
    ...tasks.filter((task: Task) => task.status === TaskStatus.COMPLETED).slice(0, 3).map((task: Task) => ({
      id: task.id,
      type: 'task_completed',
      title: `完成任务: ${task.title}`,
      timestamp: task.completedAt || task.updatedAt,
    })),
    ...objectives.slice(0, 2).map((obj: Objective) => ({
      id: obj.id,
      type: 'objective_progress',
      title: `目标进度更新: ${obj.title} (${obj.progress || 0}%)`,
      timestamp: obj.updatedAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

  // 创建任务 mutation
  const createTaskMutation = useMutation(
    (data: CreateTaskDto) => {
      const taskService = new TaskService()
      return taskService.createTask(data)
    },
    {
      onSuccess: (task) => {
        queryClient.invalidateQueries('tasks')
        queryClient.invalidateQueries('dashboardStats')
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
        queryClient.invalidateQueries('dashboardStats')
        setIsTaskFormOpen(false)
        setEditingTask(undefined)
        showSuccess('任务更新成功', `任务"${task.title}"已成功更新`)
      },
      onError: (error: any) => {
        handleApiError(error, '更新任务失败')
      },
    }
  )

  // 创建目标 mutation
  const createObjectiveMutation = useMutation(
    (data: CreateObjectiveDto) => {
      return ObjectiveService.createObjective(data)
    },
    {
      onSuccess: (objective) => {
        queryClient.invalidateQueries('objectives')
        queryClient.invalidateQueries('dashboardStats')
        setIsObjectiveFormOpen(false)
        showSuccess('目标创建成功', `目标"${objective.title}"已成功创建`)
      },
      onError: (error: any) => {
        handleApiError(error, '创建目标失败')
      },
    }
  )

  // 更新目标 mutation
  const updateObjectiveMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateObjectiveDto }) => {
      return ObjectiveService.updateObjective(id, data)
    },
    {
      onSuccess: (objective) => {
        queryClient.invalidateQueries('objectives')
        queryClient.invalidateQueries('dashboardStats')
        setIsObjectiveFormOpen(false)
        setEditingObjective(undefined)
        showSuccess('目标更新成功', `目标"${objective.title}"已成功更新`)
      },
      onError: (error: any) => {
        handleApiError(error, '更新目标失败')
      },
    }
  )

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setIsTaskFormOpen(true)
  }

  const handleCreateObjective = () => {
    setEditingObjective(undefined)
    setIsObjectiveFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective)
    setIsObjectiveFormOpen(true)
  }

  const handleTaskSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data: data as UpdateTaskDto })
    } else {
      await createTaskMutation.mutateAsync(data as CreateTaskDto)
    }
  }

  const handleObjectiveSubmit = async (data: CreateObjectiveDto | UpdateObjectiveDto) => {
    if (editingObjective) {
      await updateObjectiveMutation.mutateAsync({ id: editingObjective.id, data: data as UpdateObjectiveDto })
    } else {
      await createObjectiveMutation.mutateAsync(data as CreateObjectiveDto)
    }
  }

  // 加载状态
  const isLoading = statsLoading || objectivesLoading || tasksLoading || keyResultsLoading
  const hasError = statsError || objectivesError || tasksError || keyResultsError

  // 错误状态
  if (hasError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">加载数据失败</h2>
          <p className="text-red-700 mb-4">
            {statsError?.message || objectivesError?.message || tasksError?.message || '未知错误'}
          </p>
          <button
            onClick={() => window.location.reload()}
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600 mt-1">欢迎回来！这是您的项目概览</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleCreateObjective}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            创建目标
          </button>
          <button 
            onClick={handleCreateTask}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            创建任务
          </button>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: '概览' },
          { key: 'objectives', label: '目标' },
          { key: 'tasks', label: '任务' },
          { key: 'keyResults', label: '关键结果' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">加载中...</span>
        </div>
      )}

      {/* 核心统计卡片 */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">活跃目标</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.activeObjectives}</p>
              <p className="text-xs text-gray-400">总共 {stats.totalObjectives} 个目标</p>
            </div>
            <div className="text-3xl text-blue-500">🎯</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">待办任务</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.todoTasks + stats.inProgressTasks}</p>
              <p className="text-xs text-gray-400">逾期 {stats.overdueTasks} 个</p>
            </div>
            <div className="text-3xl text-orange-500">📋</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">已完成任务</h3>
              <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              <p className="text-xs text-gray-400">完成率 {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%</p>
            </div>
            <div className="text-3xl text-green-500">✅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">生产力评分</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.productivityScore}</p>
              <p className="text-xs text-gray-400">平均进度 {stats.avgProgress}%</p>
            </div>
            <div className="text-3xl text-purple-500">📊</div>
          </div>
        </div>
        </div>
      )}

      {/* 主要内容区域 */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 今日任务 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">今日任务</h2>
                <Link to="/tasks" className="text-blue-600 hover:text-blue-800 text-sm">查看全部</Link>
              </div>
            </div>
            <div className="p-6">
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map((task: Task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-500">{getTaskStatusLabel(task.status)}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === TaskStatus.COMPLETED ? 'bg-green-500' : 
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🎉</div>
                  <p className="text-gray-500">今天没有待办任务</p>
                </div>
              )}
            </div>
          </div>

          {/* 最近目标 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">最近目标</h2>
                <Link to="/objectives" className="text-blue-600 hover:text-blue-800 text-sm">查看全部</Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {objectives.slice(0, 3).map((objective: Objective) => (
                  <div key={objective.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{objective.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        objective.status === ObjectiveStatus.ACTIVE ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getObjectiveStatusLabel(objective.status)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${objective.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{objective.progress || 0}% 完成</span>
                      {objective.targetDate && (
                        <span>目标: {formatDate(objective.targetDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity: any) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'task_completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系统概览（overview 视图下方） */}
      {selectedView === 'overview' && systems.length > 0 && !isLoading && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">系统概览</h2>
            <Link to="/systems" className="text-blue-600 hover:text-blue-800 text-sm">管理系统</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((system: System) => {
              const progress = system.overallProgress || 0
              const radius = 28
              const circumference = 2 * Math.PI * radius
              const strokeDashoffset = circumference - (progress / 100) * circumference

              return (
                <div
                  key={system.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/systems/${system.id}`)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${system.color || '#6366F1'}20` }}
                    >
                      {system.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{system.name}</h3>
                      <p className="text-xs text-gray-500">
                        {system.objectiveCount || 0} 个目标 · {system.activeObjectiveCount || 0} 进行中
                      </p>
                    </div>
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r={radius} fill="none"
                          stroke={system.color || '#6366F1'}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-700">{progress}%</span>
                      </div>
                    </div>
                  </div>
                  {/* 迷你进度条 */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${progress}%`, backgroundColor: system.color || '#6366F1' }}
                      />
                    </div>
                    <span className="font-medium text-green-600">{system.completedObjectiveCount || 0} 完成</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedView === 'objectives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {objectivesLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载目标中...</p>
            </div>
          ) : objectives.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-4xl mb-2">🎯</div>
              <p className="text-gray-500">暂无目标，开始创建您的第一个目标吧！</p>
            </div>
          ) : (
            objectives.map((objective: Objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onEdit={handleEditObjective}
              onViewTasks={(obj) => console.log('查看任务:', obj)}
            />
            ))
          )}
        </div>
      )}

      {selectedView === 'tasks' && (
        <div className="space-y-6">
          {tasksLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载任务中...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-2">📋</div>
              <p className="text-gray-500">暂无任务，开始创建您的第一个任务吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">待办</h3>
                <div className="space-y-3">
                  {tasks.filter((task: Task) => task.status === TaskStatus.TODO).map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.filter((task: Task) => task.status === TaskStatus.TODO).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">暂无待办任务</div>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">进行中</h3>
                <div className="space-y-3">
                  {tasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS).map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">暂无进行中任务</div>
                  )}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">已完成</h3>
                <div className="space-y-3">
                  {tasks.filter((task: Task) => task.status === TaskStatus.COMPLETED).map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.filter((task: Task) => task.status === TaskStatus.COMPLETED).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">暂无已完成任务</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedView === 'keyResults' && (
        <div className="space-y-6">
          {keyResultsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载关键结果中...</p>
            </div>
          ) : keyResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-2">🎯</div>
              <p className="text-gray-500">暂无关键结果</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">关键结果概览</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {keyResults.map((kr: KeyResult) => (
                <KeyResultCard
                  key={kr.id}
                  keyResult={kr}
                    onUpdateProgress={(keyResult: KeyResult, newValue: number) => console.log('更新进度:', keyResult.id, newValue)}
                  />
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">关键结果统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{keyResults.length}</div>
                    <div className="text-sm text-gray-500">总关键结果</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {keyResults.filter((kr: KeyResult) => kr.status === KeyResultStatus.IN_PROGRESS).length}
                    </div>
                    <div className="text-sm text-gray-500">进行中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {keyResults.filter((kr: KeyResult) => kr.status === KeyResultStatus.COMPLETED).length}
                    </div>
                    <div className="text-sm text-gray-500">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {keyResults.length > 0 ? Math.round(keyResults.reduce((sum: number, kr: KeyResult) => {
                        const progress = kr.type === KeyResultType.BOOLEAN ? (kr.currentValue > 0 ? 100 : 0) :
                                       kr.type === KeyResultType.PERCENTAGE ? kr.currentValue :
                                       kr.targetValue === 0 ? 0 : Math.min((kr.currentValue / kr.targetValue) * 100, 100)
                        return sum + progress
                      }, 0) / keyResults.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-500">平均完成度</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 即将到期提醒 */}
      {upcomingTasks.length > 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="text-yellow-600">⚠️</div>
            <h3 className="font-medium text-yellow-800">即将到期的任务</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingTasks.map((task: Task) => (
              <div key={task.id} className="bg-white rounded p-3 border border-yellow-200">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-yellow-700">
                  {Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 天后到期
                </p>
              </div>
            ))}
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

      {/* 目标表单对话框 */}
      <ObjectiveForm
        objective={editingObjective}
        isOpen={isObjectiveFormOpen}
        onClose={() => {
          setIsObjectiveFormOpen(false)
          setEditingObjective(undefined)
        }}
        onSubmit={handleObjectiveSubmit}
        isLoading={createObjectiveMutation.isLoading || updateObjectiveMutation.isLoading}
      />
    </div>
  )
}

export default Dashboard 