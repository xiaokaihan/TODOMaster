import React, { useState } from 'react'
import { Task, TaskStatus, Priority, Objective } from '@shared/types'
import TaskCard from '../components/TaskCard'

// 模拟任务数据
const mockTasks: Task[] = [
  {
    id: '1',
    title: '设计组件架构',
    description: '设计可复用的组件架构，包括通用组件和业务组件的分层设计',
    priority: Priority.HIGH,
    status: TaskStatus.COMPLETED,
    dueDate: new Date('2024-01-15'),
    estimatedDuration: 480, // 8小时
    actualDuration: 450, // 7.5小时
    completedAt: new Date('2024-01-14'),
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-14'),
    tags: ['设计', '架构', 'React'],
  },
  {
    id: '2',
    title: '实现核心组件',
    description: '实现项目中最重要的业务组件，包括用户管理、数据展示等',
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date('2024-02-01'),
    estimatedDuration: 960, // 16小时
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    tags: ['开发', '组件', 'TypeScript'],
    dependencies: ['1'],
  },
  {
    id: '3',
    title: '编写单元测试',
    description: '为核心组件编写完整的单元测试，确保代码质量',
    priority: Priority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: new Date('2024-02-15'),
    estimatedDuration: 480, // 8小时
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: ['测试', 'Jest', '质量保证'],
    dependencies: ['2'],
  },
  {
    id: '4',
    title: '制定运动计划',
    description: '制定详细的每周运动计划，包括有氧运动和力量训练',
    priority: Priority.MEDIUM,
    status: TaskStatus.COMPLETED,
    dueDate: new Date('2024-01-05'),
    estimatedDuration: 120, // 2小时
    actualDuration: 90, // 1.5小时
    completedAt: new Date('2024-01-03'),
    objectiveId: '2',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-03'),
    tags: ['健身', '计划'],
  },
  {
    id: '5',
    title: '坚持每日运动',
    description: '按照制定的计划执行每日运动，记录运动数据',
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    estimatedDuration: 60, // 每天1小时
    objectiveId: '2',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
    tags: ['健身', '习惯'],
    dependencies: ['4'],
  },
  {
    id: '6',
    title: '学习 TypeScript 泛型',
    description: '深入学习 TypeScript 泛型的高级用法和最佳实践',
    priority: Priority.MEDIUM,
    status: TaskStatus.WAITING,
    dueDate: new Date('2024-02-20'),
    estimatedDuration: 360, // 6小时
    objectiveId: '3',
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    tags: ['学习', 'TypeScript', '编程'],
  },
]

// 模拟目标数据（用于显示目标信息）
const mockObjectives: Objective[] = [
  {
    id: '1',
    title: '完成 React 项目重构',
    category: 'PROFESSIONAL' as any,
    priority: Priority.HIGH,
    status: 'ACTIVE' as any,
    startDate: new Date('2024-01-01'),
    userId: 'user1',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: '健身计划：减重 10kg',
    category: 'HEALTH' as any,
    priority: Priority.MEDIUM,
    status: 'ACTIVE' as any,
    startDate: new Date('2024-01-01'),
    userId: 'user1',
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    title: '学习 TypeScript 高级特性',
    category: 'LEARNING' as any,
    priority: Priority.MEDIUM,
    status: 'DRAFT' as any,
    startDate: new Date('2024-02-01'),
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
]

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [filter, setFilter] = useState<{
    status?: TaskStatus
    priority?: Priority
    objectiveId?: string
    search?: string
  }>({})

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false
    if (filter.priority && task.priority !== filter.priority) return false
    if (filter.objectiveId && task.objectiveId !== filter.objectiveId) return false
    if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  // 按状态分组任务
  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter(task => task.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.WAITING]: filteredTasks.filter(task => task.status === TaskStatus.WAITING),
    [TaskStatus.COMPLETED]: filteredTasks.filter(task => task.status === TaskStatus.COMPLETED),
    [TaskStatus.CANCELLED]: filteredTasks.filter(task => task.status === TaskStatus.CANCELLED),
  }

  const handleEditTask = (task: Task) => {
    console.log('编辑任务:', task)
    // TODO: 实现编辑功能
  }

  const handleDeleteTask = (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      setTasks(tasks.filter(task => task.id !== id))
    }
  }

  const handleStartTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status: TaskStatus.IN_PROGRESS, updatedAt: new Date() } : task
    ))
  }

  const handleCompleteTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? {
        ...task,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date()
      } : task
    ))
  }

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status, updatedAt: new Date() } : task
    ))
  }



  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">任务管理</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          创建任务
        </button>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">关联目标</label>
            <select
              value={filter.objectiveId || ''}
              onChange={(e) => setFilter({ ...filter, objectiveId: e.target.value || undefined })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部目标</option>
              {mockObjectives.map(objective => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
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
            {Math.round((tasks.filter(task => task.status === TaskStatus.COMPLETED).length / tasks.length) * 100) || 0}%
          </p>
        </div>
      </div>

      {/* 看板视图 */}
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

      {/* 任务详情信息 */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">任务分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">按目标分组</h4>
            <div className="space-y-2">
              {mockObjectives.map(objective => {
                const objectiveTasks = tasks.filter(task => task.objectiveId === objective.id)
                const completedCount = objectiveTasks.filter(task => task.status === TaskStatus.COMPLETED).length
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
              {tasks.filter(task => 
                task.dueDate && 
                new Date(task.dueDate) < new Date() && 
                task.status !== TaskStatus.COMPLETED
              ).map(task => (
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
              {tasks.filter(task => {
                if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
                const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysLeft > 0 && daysLeft <= 7
              }).map(task => (
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
    </div>
  )
}

export default Tasks 