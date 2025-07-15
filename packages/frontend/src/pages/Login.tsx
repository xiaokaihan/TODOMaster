import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthService } from '../services/authService'
import { showSuccess, showError } from '../utils/notification'

interface LoginForm {
  email: string
  password: string
}

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  
  const navigate = useNavigate()
  const location = useLocation()
  
  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  // 检查是否已登录
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate(from, { replace: true })
    }
  }, [navigate, from])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {}

    if (!form.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!form.password) {
      newErrors.password = '请输入密码'
    } else if (form.password.length < 6) {
      newErrors.password = '密码至少6位'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // 清除对应字段的错误
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await AuthService.login({
        email: form.email,
        password: form.password
      })

      showSuccess('登录成功！', '欢迎回来！', 2000)
      navigate(from, { replace: true })
    } catch (error: any) {
      console.error('登录失败:', error)
      showError(error.message || '登录失败，请检查邮箱和密码')
      
      // 处理特定错误
      if (error.status === 401) {
        setErrors({ password: '邮箱或密码错误' })
      } else if (error.status === 429) {
        showError('登录尝试过于频繁，请稍后再试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 处理忘记密码
  const handleForgotPassword = async () => {
    if (!form.email) {
      showError('请先输入邮箱地址')
      return
    }

    try {
      await AuthService.requestPasswordReset({ email: form.email })
      showSuccess('密码重置邮件已发送，请查收')
    } catch (error: any) {
      showError(error.message || '发送重置邮件失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到 TODOMaster
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="请输入邮箱地址"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleInputChange}
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="请输入密码"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-blue-600 hover:text-blue-500"
                disabled={isLoading}
              >
                忘记密码？
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 