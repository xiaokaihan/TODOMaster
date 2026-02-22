import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { System } from '@shared/types'
import { AuthService } from '../services/authService'
import { SystemService } from '../services/systemService'
import { showSuccess } from '../utils/notification'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(AuthService.getUser())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [systems, setSystems] = useState<System[]>([])
  const [showSystemList, setShowSystemList] = useState(true)

  const navigation = [
    { name: '仪表板', href: '/dashboard', icon: '📊' },
    { name: '目标管理', href: '/objectives', icon: '🎯' },
    { name: '任务中心', href: '/tasks', icon: '✅' },
  ]

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }

    if (!user) {
      fetchUser()
    }
  }, [user])

  // 获取系统列表
  useEffect(() => {
    const loadSystems = async () => {
      try {
        const data = await SystemService.getSystems()
        setSystems(data)
      } catch (error) {
        console.error('获取系统列表失败:', error)
      }
    }
    loadSystems()
  }, [])

  // 监听路由变化刷新系统列表（例如创建了新系统后）
  useEffect(() => {
    if (location.pathname === '/systems') {
      SystemService.getSystems().then(setSystems).catch(() => {})
    }
  }, [location.pathname])

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await AuthService.logout()
      showSuccess('已安全退出登录', '欢迎下次再来！', 2000)
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      AuthService.clearAuthData()
      navigate('/login')
    }
  }

  // 获取用户头像字母
  const getUserInitials = () => {
    if (!user) return 'U'
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email.charAt(0).toUpperCase()
  }

  // 获取当前页面名称
  const getCurrentPageName = () => {
    // 检查是否在系统详情页
    const systemMatch = location.pathname.match(/^\/systems\/(.+)$/)
    if (systemMatch) {
      const system = systems.find(s => s.id === systemMatch[1])
      return system ? `${system.icon || '📋'} ${system.name}` : '系统详情'
    }
    if (location.pathname === '/systems') return '我的系统'
    const currentNav = navigation.find(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))
    return currentNav?.name || '仪表板'
  }

  // 判断系统是否选中
  const isSystemActive = (systemId: string) => {
    return location.pathname === `/systems/${systemId}`
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <Link to="/dashboard" className="text-xl font-bold text-white hover:text-blue-100 transition-colors">
            TODOMaster
          </Link>
        </div>

        {/* 导航区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto">
          {/* 主导航 */}
          <nav className="px-4 pt-5 pb-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 系统切换区 */}
          <div className="px-4 pt-3 pb-4">
            <button
              onClick={() => setShowSystemList(!showSystemList)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              <span>我的系统</span>
              <div className="flex items-center space-x-1">
                <Link
                  to="/systems"
                  onClick={(e) => e.stopPropagation()}
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  title="管理系统"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showSystemList ? '' : '-rotate-90'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showSystemList && (
              <div className="mt-1 space-y-0.5">
                {systems.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-400 mb-2">还没有创建系统</p>
                    <Link
                      to="/systems"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + 创建第一个系统
                    </Link>
                  </div>
                ) : (
                  systems.map(system => {
                    const active = isSystemActive(system.id)
                    const progress = system.overallProgress || 0
                    return (
                      <Link
                        key={system.id}
                        to={`/systems/${system.id}`}
                        className={`flex items-center px-3 py-2 rounded-lg transition-all group ${
                          active
                            ? 'bg-opacity-15 text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        style={active ? { backgroundColor: `${system.color || '#6366F1'}15` } : {}}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: `${system.color || '#6366F1'}20` }}
                        >
                          {system.icon || '📋'}
                        </span>
                        <div className="ml-2.5 flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{system.name}</p>
                          <div className="flex items-center mt-0.5">
                            <div className="flex-1 bg-gray-200 rounded-full h-1 mr-2">
                              <div
                                className="h-1 rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: system.color || '#6366F1'
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{progress}%</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : '加载中...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showUserMenu ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 用户下拉菜单 */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { setShowUserMenu(false) }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  个人设置
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout() }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {getCurrentPageName()}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-400 hover:text-gray-500 relative"
                title="通知"
              >
                <span className="sr-only">通知</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V7c0-1.12-.88-2-2-2s-2 .88-2 2v5l-5 5h5m0 0v3a2 2 0 002 2 2 2 0 002-2v-3" />
                </svg>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* 点击外部关闭菜单 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  )
}

export default Layout 