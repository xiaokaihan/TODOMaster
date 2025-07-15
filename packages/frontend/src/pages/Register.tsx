import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthService } from '../services/authService'
import { showSuccess, showError } from '../utils/notification'

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  
  const navigate = useNavigate()

  // 检查是否已登录
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {}

    if (!form.firstName.trim()) {
      newErrors.firstName = '请输入名字'
    } else if (form.firstName.trim().length < 2) {
      newErrors.firstName = '名字至少2个字符'
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = '请输入姓氏'
    } else if (form.lastName.trim().length < 2) {
      newErrors.lastName = '姓氏至少2个字符'
    }

    if (!form.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!form.password) {
      newErrors.password = '请输入密码'
    } else if (form.password.length < 8) {
      newErrors.password = '密码至少8位'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = '密码必须包含大小写字母和数字'
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // 清除对应字段的错误
    if (errors[name as keyof RegisterForm]) {
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
      await AuthService.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      })

      showSuccess('注册成功！', '欢迎使用TODOMaster')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('注册失败:', error)
      
      // 处理特定错误
      if (error.status === 409) {
        setErrors({ email: '该邮箱已被注册' })
      } else if (error.status === 400 && error.errors) {
        // 处理字段验证错误
        const fieldErrors: Partial<RegisterForm> = {}
        error.errors.forEach((err: string) => {
          if (err.includes('邮箱')) {
            fieldErrors.email = err
          } else if (err.includes('密码')) {
            fieldErrors.password = err
          } else if (err.includes('名字')) {
            fieldErrors.firstName = err
          } else if (err.includes('姓氏')) {
            fieldErrors.lastName = err
          }
        })
        setErrors(fieldErrors)
      } else {
        showError(error.message || '注册失败，请稍后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册 TODOMaster 账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  名字
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="请输入名字"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  姓氏
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="请输入姓氏"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>
            
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
                placeholder="至少8位，包含大小写字母和数字"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleInputChange}
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="请再次输入密码"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
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
                  注册中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-600 text-center">
            注册即表示您同意我们的{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              服务条款
            </a>{' '}
            和{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              隐私政策
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register 