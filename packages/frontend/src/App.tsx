import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { AuthService } from './services/authService'

// 页面组件
import Dashboard from './pages/Dashboard'
import Objectives from './pages/Objectives'
import Tasks from './pages/Tasks'
import { KeyResults } from './pages/KeyResults'
import Login from './pages/Login'
import Register from './pages/Register'

// 布局组件
import Layout from './components/Layout'
import NotificationContainer from './components/NotificationContainer'

// 路由保护组件
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* 认证路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 主应用路由 - 需要认证 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="objectives" element={<Objectives />} />
              <Route path="key-results" element={<KeyResults />} />
              <Route path="tasks" element={<Tasks />} />
            </Route>
            
            {/* 404 页面 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* 通知容器 */}
          <NotificationContainer />
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App 