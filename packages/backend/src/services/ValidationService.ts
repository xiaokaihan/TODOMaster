import { createValidationError } from '../middleware/errorHandler'

export class ValidationService {
  // 邮箱验证
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 密码验证
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return { isValid: false, message: '密码长度至少为6位' }
    }

    if (password.length > 128) {
      return { isValid: false, message: '密码长度不能超过128位' }
    }

    // 检查是否包含至少一个字母和一个数字
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    
    if (!hasLetter || !hasNumber) {
      return { isValid: false, message: '密码必须包含至少一个字母和一个数字' }
    }

    return { isValid: true }
  }

  // UUID 验证
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // 目标分类验证
  static validateObjectiveCategory(category: string): boolean {
    const validCategories = ['WORK', 'PERSONAL', 'HEALTH', 'LEARNING', 'FINANCE', 'OTHER']
    return validCategories.includes(category)
  }

  // 目标状态验证
  static validateObjectiveStatus(status: string): boolean {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
    return validStatuses.includes(status)
  }

  // 关键结果类型验证
  static validateKeyResultType(type: string): boolean {
    const validTypes = ['NUMERIC', 'PERCENTAGE', 'BOOLEAN']
    return validTypes.includes(type)
  }

  // 关键结果状态验证
  static validateKeyResultStatus(status: string): boolean {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
    return validStatuses.includes(status)
  }

  // 任务优先级验证
  static validateTaskPriority(priority: string): boolean {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    return validPriorities.includes(priority)
  }

  // 任务状态验证
  static validateTaskStatus(status: string): boolean {
    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    return validStatuses.includes(status)
  }

  // 用户角色验证
  static validateUserRole(role: string): boolean {
    const validRoles = ['user', 'admin']
    return validRoles.includes(role)
  }

  // 时区验证
  static validateTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch (error) {
      return false
    }
  }

  // 日期范围验证
  static validateDateRange(startDate: string | Date, endDate: string | Date): boolean {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false
    }
    
    return start <= end
  }

  // 分页参数验证
  static validatePaginationParams(page?: string, limit?: string): { page: number; limit: number } {
    let pageNum = parseInt(page || '1')
    let limitNum = parseInt(limit || '20')

    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1
    }

    if (isNaN(limitNum) || limitNum < 1) {
      limitNum = 20
    }

    // 限制最大页面大小
    if (limitNum > 100) {
      limitNum = 100
    }

    return { page: pageNum, limit: limitNum }
  }

  // 数值验证
  static validateNumber(value: any, min?: number, max?: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      return false
    }

    if (min !== undefined && value < min) {
      return false
    }

    if (max !== undefined && value > max) {
      return false
    }

    return true
  }

  // 字符串长度验证
  static validateStringLength(value: string, minLength?: number, maxLength?: number): boolean {
    if (typeof value !== 'string') {
      return false
    }

    if (minLength !== undefined && value.length < minLength) {
      return false
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return false
    }

    return true
  }

  // 综合验证：用户注册数据
  static validateUserRegistration(data: { email: string; password: string; name: string }) {
    const errors: string[] = []

    if (!data.email || !this.validateEmail(data.email)) {
      errors.push('无效的邮箱地址')
    }

    const passwordValidation = this.validatePassword(data.password)
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message!)
    }

    if (!data.name || !this.validateStringLength(data.name, 1, 100)) {
      errors.push('姓名长度必须在1-100个字符之间')
    }

    if (errors.length > 0) {
      throw createValidationError(errors.join('; '))
    }
  }

  // 综合验证：目标创建数据
  static validateObjectiveCreation(data: { 
    title: string; 
    description?: string; 
    category: string; 
    startDate?: string; 
    endDate?: string 
  }) {
    const errors: string[] = []

    if (!data.title || !this.validateStringLength(data.title, 3, 200)) {
      errors.push('标题长度必须在3-200个字符之间')
    }

    if (data.description && !this.validateStringLength(data.description, 0, 1000)) {
      errors.push('描述长度不能超过1000个字符')
    }

    if (!data.category || !this.validateObjectiveCategory(data.category)) {
      errors.push('无效的目标分类')
    }

    if (data.startDate && data.endDate && !this.validateDateRange(data.startDate, data.endDate)) {
      errors.push('开始日期必须早于或等于结束日期')
    }

    if (errors.length > 0) {
      throw createValidationError(errors.join('; '))
    }
  }

  // 综合验证：任务创建数据
  static validateTaskCreation(data: {
    title: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
    dueDate?: string;
  }) {
    const errors: string[] = []

    if (!data.title || !this.validateStringLength(data.title, 1, 200)) {
      errors.push('标题长度必须在1-200个字符之间')
    }

    if (data.description && !this.validateStringLength(data.description, 0, 1000)) {
      errors.push('描述长度不能超过1000个字符')
    }

    if (data.priority && !this.validateTaskPriority(data.priority)) {
      errors.push('无效的任务优先级')
    }

    if (data.estimatedHours && !this.validateNumber(data.estimatedHours, 0, 1000)) {
      errors.push('预估时间必须在0-1000小时之间')
    }

    if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
      errors.push('无效的截止日期')
    }

    if (errors.length > 0) {
      throw createValidationError(errors.join('; '))
    }
  }

  // 综合验证：关键结果创建数据
  static validateKeyResultCreation(data: {
    title: string;
    description?: string;
    type: string;
    targetValue: number;
    unit?: string;
  }) {
    const errors: string[] = []

    if (!data.title || !this.validateStringLength(data.title, 1, 200)) {
      errors.push('标题长度必须在1-200个字符之间')
    }

    if (data.description && !this.validateStringLength(data.description, 0, 1000)) {
      errors.push('描述长度不能超过1000个字符')
    }

    if (!data.type || !this.validateKeyResultType(data.type)) {
      errors.push('无效的关键结果类型')
    }

    if (!this.validateNumber(data.targetValue, 0)) {
      errors.push('目标值必须是非负数')
    }

    if (data.unit && !this.validateStringLength(data.unit, 0, 50)) {
      errors.push('单位长度不能超过50个字符')
    }

    if (errors.length > 0) {
      throw createValidationError(errors.join('; '))
    }
  }
} 
