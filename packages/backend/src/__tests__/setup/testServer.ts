import request from 'supertest'
import app from '../../app'
import jwt from 'jsonwebtoken'
import { TestUser } from './testDb'

// 生成JWT token
export const generateToken = (user: TestUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-jwt-secret-key',
    { expiresIn: '1h' }
  )
}

// 创建带认证的请求
export const authenticatedRequest = (user: TestUser) => {
  const token = generateToken(user)
  return {
    get: (url: string) => 
      request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => 
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => 
      request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => 
      request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => 
      request(app).delete(url).set('Authorization', `Bearer ${token}`)
  }
}

// 创建未认证的请求
export const unauthenticatedRequest = () => {
  return {
    get: (url: string) => request(app).get(url),
    post: (url: string) => request(app).post(url),
    put: (url: string) => request(app).put(url),
    patch: (url: string) => request(app).patch(url),
    delete: (url: string) => request(app).delete(url)
  }
}

// API前缀
export const API_PREFIX = process.env.API_PREFIX || '/api/v1'

// 常用的测试数据
export const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  validAdmin: {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Test Admin'
  },
  validObjective: {
    title: '完成项目开发',
    description: '在规定时间内完成项目开发工作',
    category: 'work',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  validTask: {
    title: '编写测试用例',
    description: '为所有API接口编写完整的测试用例',
    priority: 'high',
    estimatedHours: 8
  }
} 