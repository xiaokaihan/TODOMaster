import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Objective, Task, ObjectiveStatus, TaskStatus, Priority, KeyResult, KeyResultType, KeyResultStatus } from '@shared/types'
import { formatDate, formatDateTime, getObjectiveStatusLabel, getTaskStatusLabel } from '@shared/utils'
import ObjectiveCard from '../components/ObjectiveCard'
import TaskCard from '../components/TaskCard'
import { KeyResultCard } from '../components/KeyResultCard'

// 模拟数据（从其他页面复制，实际应该从API获取）
const mockObjectives: Objective[] = [
  {
    id: '1',
    title: '完成 React 项目重构',
    description: '将现有的 Vue 项目完全重构为 React 架构',
    category: 'PROFESSIONAL' as any,
    priority: Priority.HIGH,
    status: ObjectiveStatus.ACTIVE,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-03-31'),
    userId: 'user1',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-15'),
    progress: 65,
  },
  {
    id: '2',
    title: '健身计划：减重 10kg',
    description: '通过合理饮食和运动减重',
    category: 'HEALTH' as any,
    priority: Priority.MEDIUM,
    status: ObjectiveStatus.ACTIVE,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-06-30'),
    userId: 'user1',
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2024-01-20'),
    progress: 30,
  },
]

const mockTasks: Task[] = [
  {
    id: '1',
    title: '设计组件架构',
    description: '设计可复用的组件架构',
    priority: Priority.HIGH,
    status: TaskStatus.COMPLETED,
    dueDate: new Date('2024-01-15'),
    completedAt: new Date('2024-01-14'),
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '2',
    title: '实现核心组件',
    description: '实现主要的业务组件',
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date('2024-02-01'),
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    title: '编写单元测试',
    description: '为组件编写测试',
    priority: Priority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: new Date('2024-02-15'),
    objectiveId: '1',
    userId: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    title: '坚持每日运动',
    description: '按计划执行运动',
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    objectiveId: '2',
    userId: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  },
]

const mockKeyResults: KeyResult[] = [
  {
    id: 'kr1',
    title: '代码覆盖率达到 80%',
    targetValue: 80,
    currentValue: 52,
    unit: '%',
    type: KeyResultType.PERCENTAGE,
    status: KeyResultStatus.IN_PROGRESS,
    progress: 65,
    objectiveId: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'kr2',
    title: '每周运动 4 次',
    targetValue: 4,
    currentValue: 3,
    unit: '次',
    type: KeyResultType.NUMERIC,
    status: KeyResultStatus.IN_PROGRESS,
    progress: 75,
    objectiveId: '2',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  },
]

const Dashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'overview' | 'objectives' | 'tasks' | 'keyResults'>('overview')

  // 计算统计数据
  const stats = {
    totalObjectives: mockObjectives.length,
    activeObjectives: mockObjectives.filter(obj => obj.status === ObjectiveStatus.ACTIVE).length,
    completedObjectives: mockObjectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length,
    totalTasks: mockTasks.length,
    todoTasks: mockTasks.filter(task => task.status === TaskStatus.TODO).length,
    inProgressTasks: mockTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
    completedTasks: mockTasks.filter(task => task.status === TaskStatus.COMPLETED).length,
    overdueTasks: mockTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED
    ).length,
    avgProgress: Math.round(mockObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / mockObjectives.length || 0),
    productivityScore: 85, // 模拟计算的生产力分数
  }

  // 今日任务
  const todayTasks = mockTasks.filter(task => {
    if (!task.dueDate) return false
    const today = new Date()
    const taskDate = new Date(task.dueDate)
    return taskDate.toDateString() === today.toDateString()
  })

  // 即将到期的任务
  const upcomingTasks = mockTasks.filter(task => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false
    const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 7
  })

  // 最近活动
  const recentActivities = [
    ...mockTasks.filter(task => task.status === TaskStatus.COMPLETED).slice(0, 3).map(task => ({
      id: task.id,
      type: 'task_completed',
      title: `完成任务: ${task.title}`,
      timestamp: task.completedAt || task.updatedAt,
    })),
    ...mockObjectives.slice(0, 2).map(obj => ({
      id: obj.id,
      type: 'objective_progress',
      title: `目标进度更新: ${obj.title} (${obj.progress}%)`,
      timestamp: obj.updatedAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600 mt-1">欢迎回来！这是您的项目概览</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            创建目标
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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

      {/* 核心统计卡片 */}
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
                  {todayTasks.map(task => (
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
                {mockObjectives.slice(0, 3).map(objective => (
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
                {recentActivities.map(activity => (
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

      {selectedView === 'objectives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockObjectives.map(objective => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onEdit={(obj) => console.log('编辑目标:', obj)}
              onViewTasks={(obj) => console.log('查看任务:', obj)}
            />
          ))}
        </div>
      )}

      {selectedView === 'tasks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">待办</h3>
              <div className="space-y-3">
                {mockTasks.filter(task => task.status === TaskStatus.TODO).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">进行中</h3>
              <div className="space-y-3">
                {mockTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">已完成</h3>
              <div className="space-y-3">
                {mockTasks.filter(task => task.status === TaskStatus.COMPLETED).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'keyResults' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">关键结果概览</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockKeyResults.map(kr => (
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
                <div className="text-2xl font-bold text-gray-900">{mockKeyResults.length}</div>
                <div className="text-sm text-gray-500">总关键结果</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mockKeyResults.filter(kr => kr.status === KeyResultStatus.IN_PROGRESS).length}
                </div>
                <div className="text-sm text-gray-500">进行中</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mockKeyResults.filter(kr => kr.status === KeyResultStatus.COMPLETED).length}
                </div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(mockKeyResults.reduce((sum, kr) => {
                    const progress = kr.type === KeyResultType.BOOLEAN ? (kr.currentValue > 0 ? 100 : 0) :
                                   kr.type === KeyResultType.PERCENTAGE ? kr.currentValue :
                                   kr.targetValue === 0 ? 0 : Math.min((kr.currentValue / kr.targetValue) * 100, 100)
                    return sum + progress
                  }, 0) / mockKeyResults.length)}%
                </div>
                <div className="text-sm text-gray-500">平均完成度</div>
              </div>
            </div>
          </div>
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
            {upcomingTasks.map(task => (
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
    </div>
  )
}

export default Dashboard 