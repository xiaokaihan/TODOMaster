import { Request, Response } from 'express'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'
import { businessLogger } from '../middleware/logger'
import { ValidationService } from '../services/ValidationService'
import { PaginationInfo } from '../models/types/Common'

export abstract class BaseController {
  /**
   * 验证用户是否已认证
   */
  protected static validateUser(req: Request): string {
    const userId = req.user?.id
    if (!userId) {
      throw createValidationError('用户信息不存在')
    }
    return userId
  }

  /**
   * 验证分页参数
   */
  protected static validatePagination(page?: string, limit?: string) {
    return ValidationService.validatePaginationParams(
      page || '1',
      limit || '20'
    )
  }

  /**
   * 构建标准成功响应
   */
  protected static buildSuccessResponse<T>(
    data: T,
    message?: string,
    pagination?: PaginationInfo
  ) {
    const response: any = {
      success: true,
      data
    }

    if (message) {
      response.message = message
    }

    if (pagination) {
      response.pagination = pagination
    }

    return response
  }

  /**
   * 构建分页响应
   */
  protected static buildPaginatedResponse<T>(
    items: T[],
    pagination: PaginationInfo,
    dataKey: string = 'items'
  ) {
    return {
      success: true,
      data: {
        [dataKey]: items,
        pagination
      }
    }
  }

  /**
   * 记录业务操作日志
   */
  protected static logOperation(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    userId: string
  ) {
    switch (operation) {
      case 'create':
        businessLogger.create(entityType, entityId, userId)
        break
      case 'update':
        businessLogger.update(entityType, entityId, userId)
        break
      case 'delete':
        businessLogger.delete(entityType, entityId, userId)
        break
    }
  }

  /**
   * 执行数据库事务
   */
  protected static async executeTransaction<T>(
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 验证实体所有权
   */
  protected static async validateOwnership(
    tableName: string,
    entityId: string,
    userId: string,
    entityName: string = '资源'
  ): Promise<any> {
    let query: string
    let params: any[]

    // 根据表名构建查询
    if (tableName === 'objectives') {
      query = 'SELECT * FROM objectives WHERE id = $1 AND user_id = $2'
      params = [entityId, userId]
    } else if (tableName === 'tasks') {
      query = `
        SELECT t.* FROM tasks t
        JOIN objectives o ON t.objective_id = o.id
        WHERE t.id = $1 AND o.user_id = $2
      `
      params = [entityId, userId]
    } else if (tableName === 'key_results') {
      query = `
        SELECT kr.* FROM key_results kr
        JOIN objectives o ON kr.objective_id = o.id
        WHERE kr.id = $1 AND o.user_id = $2
      `
      params = [entityId, userId]
    } else {
      throw createValidationError('不支持的实体类型')
    }

    const result = await pool.query(query, params)
    
    if (result.rows.length === 0) {
      throw createValidationError(`${entityName}不存在或无权限访问`)
    }

    return result.rows[0]
  }

  /**
   * 构建搜索条件
   */
  protected static buildSearchConditions(
    baseConditions: string[],
    searchFields: string[],
    searchTerm?: string
  ): { conditions: string[], params: any[] } {
    const conditions = [...baseConditions]
    const params: any[] = []

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields
        .map((field, index) => `${field} ILIKE $${conditions.length + index + 1}`)
        .join(' OR ')
      
      conditions.push(`(${searchConditions})`)
      
      // 为每个搜索字段添加参数
      searchFields.forEach(() => {
        params.push(`%${searchTerm}%`)
      })
    }

    return { conditions, params }
  }

  /**
   * 计算总记录数
   */
  protected static async getTotalCount(
    tableName: string,
    whereClause: string,
    params: any[]
  ): Promise<number> {
    const countQuery = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`
    const countResult = await pool.query(countQuery, params)
    return parseInt(countResult.rows[0].count)
  }
} 