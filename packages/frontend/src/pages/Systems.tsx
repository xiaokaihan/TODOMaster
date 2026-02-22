import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { System, SystemStatus, CreateSystemDto, UpdateSystemDto } from '@shared/types'
import SystemCard from '../components/SystemCard'
import SystemForm from '../components/SystemForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { SystemService } from '../services/systemService'
import { showSuccess, handleApiError } from '../utils/notification'

const Systems: React.FC = () => {
  const navigate = useNavigate()
  const [systems, setSystems] = useState<System[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingSystem, setDeletingSystem] = useState<System | null>(null)
  const [statusFilter, setStatusFilter] = useState<SystemStatus | ''>('')

  const loadSystems = async () => {
    try {
      setIsLoading(true)
      const params = statusFilter ? { status: statusFilter as SystemStatus } : {}
      const data = await SystemService.getSystems(params)
      setSystems(data)
    } catch (error) {
      handleApiError(error, '加载系统列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSystems()
  }, [statusFilter])

  const handleSystemClick = (system: System) => {
    navigate(`/systems/${system.id}`)
  }

  const handleCreateSystem = async (data: CreateSystemDto) => {
    try {
      const newSystem = await SystemService.createSystem(data)
      setSystems(prev => [...prev, newSystem])
      setShowForm(false)
      showSuccess('系统创建成功', `系统"${newSystem.name}"已创建`, 2000)
    } catch (error) {
      handleApiError(error, '创建系统失败')
    }
  }

  const handleUpdateSystem = async (data: UpdateSystemDto) => {
    if (!editingSystem) return
    try {
      const updated = await SystemService.updateSystem(editingSystem.id, data)
      setSystems(prev => prev.map(s => s.id === editingSystem.id ? { ...s, ...updated } : s))
      setShowForm(false)
      setEditingSystem(null)
      showSuccess('系统更新成功', `系统"${updated.name}"已更新`, 2000)
    } catch (error) {
      handleApiError(error, '更新系统失败')
    }
  }

  const handleEditSystem = (system: System) => {
    setEditingSystem(system)
    setShowForm(true)
  }

  const handleArchiveSystem = async (system: System) => {
    try {
      const updated = await SystemService.updateSystem(system.id, { status: SystemStatus.ARCHIVED })
      setSystems(prev => prev.map(s => s.id === system.id ? { ...s, ...updated } : s))
      showSuccess('系统已归档', `系统"${system.name}"已归档`, 2000)
    } catch (error) {
      handleApiError(error, '归档系统失败')
    }
  }

  const confirmDeleteSystem = async () => {
    if (!deletingSystem) return
    try {
      await SystemService.deleteSystem(deletingSystem.id)
      setSystems(prev => prev.filter(s => s.id !== deletingSystem.id))
      setShowDeleteDialog(false)
      setDeletingSystem(null)
      showSuccess('系统删除成功', '系统及其所有目标已被删除', 2000)
    } catch (error) {
      handleApiError(error, '删除系统失败')
    }
  }

  // 统计
  const totalSystems = systems.length
  const activeSystems = systems.filter(s => s.status === SystemStatus.ACTIVE).length
  const totalObjectives = systems.reduce((sum, s) => sum + (s.objectiveCount || 0), 0)
  const avgProgress = totalSystems > 0
    ? Math.round(systems.reduce((sum, s) => sum + (s.overallProgress || 0), 0) / totalSystems)
    : 0

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">加载系统数据中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的系统</h1>
          <p className="text-gray-500 mt-1">管理你的各个生活领域和持续性体系</p>
        </div>
        <button
          onClick={() => { setEditingSystem(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建系统
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">总系统数</h3>
          <p className="text-2xl font-bold text-gray-900">{totalSystems}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">活跃系统</h3>
          <p className="text-2xl font-bold text-blue-600">{activeSystems}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">总目标数</h3>
          <p className="text-2xl font-bold text-purple-600">{totalObjectives}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500">平均进度</h3>
          <p className="text-2xl font-bold text-green-600">{avgProgress}%</p>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center space-x-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SystemStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">全部状态</option>
          <option value={SystemStatus.ACTIVE}>活跃</option>
          <option value={SystemStatus.PAUSED}>暂停</option>
          <option value={SystemStatus.ARCHIVED}>归档</option>
        </select>
      </div>

      {/* 系统卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {systems.map(system => (
          <SystemCard
            key={system.id}
            system={system}
            onClick={handleSystemClick}
            onEdit={handleEditSystem}
            onArchive={handleArchiveSystem}
          />
        ))}

        {systems.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="text-gray-400 text-5xl mb-4">🏗️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有任何系统</h3>
            <p className="text-gray-500 mb-6">创建你的第一个系统来管理生活的各个方面</p>
            <button
              onClick={() => { setEditingSystem(null); setShowForm(true) }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建第一个系统
            </button>
          </div>
        )}
      </div>

      {/* 系统表单 */}
      <SystemForm
        system={editingSystem || undefined}
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingSystem(null) }}
        onSubmit={(data) => editingSystem ? handleUpdateSystem(data as UpdateSystemDto) : handleCreateSystem(data as CreateSystemDto)}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="确认删除系统"
        message={`确定要删除系统"${deletingSystem?.name}"吗？此操作将同时删除该系统下的所有目标、关键结果和任务，且无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteSystem}
        onCancel={() => { setShowDeleteDialog(false); setDeletingSystem(null) }}
        type="danger"
      />
    </div>
  )
}

export default Systems
