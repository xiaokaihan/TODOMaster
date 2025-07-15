import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthService } from '../services/authService'
import { showSuccess } from '../utils/notification'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(AuthService.getUser())
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigation = [
    { name: '仪表板', href: '/dashboard', icon: '📊' },
    { name: '目标管理', href: '/objectives', icon: '🎯' },
    { name: '关键结果', href: '/key-results', icon: '🔑' },
    { name: '任务管理', href: '/tasks', icon: '✅' },
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

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await AuthService.logout()
      showSuccess('已安全退出登录', '欢迎下次再来！', 2000)
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使失败也清除本地数据
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
    const currentNav = navigation.find(item => item.href === location.pathname)
    return currentNav?.name || '仪表板'
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">TODOMaster</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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

        {/* 用户信息 */}
        <div className="px-4 py-4 border-t border-gray-200">
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
                  onClick={() => {
                    setShowUserMenu(false)
                    // TODO: 导航到个人设置页面
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  个人设置
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    // TODO: 导航到账户设置页面
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  账户设置
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout()
                  }}
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
                {/* 通知红点 */}
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <button 
                className="text-gray-400 hover:text-gray-500"
                title="设置"
              >
                <span className="sr-only">设置</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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