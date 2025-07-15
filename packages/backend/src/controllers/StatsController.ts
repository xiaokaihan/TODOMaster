import { Request, Response } from 'express'
import { BaseController } from './BaseController'
import { ValidationService } from '../services/ValidationService'
import { pool } from '../config/database'
import { createValidationError } from '../middleware/errorHandler'

export class StatsController extends BaseController {
  // 获取总体统计信息
  static async getOverallStats(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const statsQuery = `
      SELECT 
        -- 目标统计
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1) as total_objectives,
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'COMPLETED') as completed_objectives,
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'IN_PROGRESS') as in_progress_objectives,
        (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'NOT_STARTED') as not_started_objectives,
        
        -- 关键结果统计
        (SELECT COUNT(*) FROM key_results kr JOIN objectives o ON kr.objective_id = o.id WHERE o.user_id = $1) as total_key_results,
        (SELECT COUNT(*) FROM key_results kr JOIN objectives o ON kr.objective_id = o.id WHERE o.user_id = $1 AND kr.status = 'COMPLETED') as completed_key_results,
        (SELECT AVG(kr.progress) FROM key_results kr JOIN objectives o ON kr.objective_id = o.id WHERE o.user_id = $1) as avg_key_result_progress,
        
        -- 任务统计
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'COMPLETED') as completed_tasks,
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'IN_PROGRESS') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'TODO') as todo_tasks,
        
        -- 时间统计
        (SELECT SUM(estimated_hours) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1) as total_estimated_hours,
        (SELECT SUM(actual_hours) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'COMPLETED') as total_actual_hours
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    // 计算完成率
    const objectiveCompletionRate = stats.total_objectives > 0 
      ? Math.round((stats.completed_objectives / stats.total_objectives) * 100)
      : 0

    const keyResultCompletionRate = stats.total_key_results > 0
      ? Math.round((stats.completed_key_results / stats.total_key_results) * 100)
      : 0

    const taskCompletionRate = stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0

    const responseData = {
      overall: {
        objectives: {
          total: parseInt(stats.total_objectives),
          completed: parseInt(stats.completed_objectives),
          inProgress: parseInt(stats.in_progress_objectives),
          notStarted: parseInt(stats.not_started_objectives),
          completionRate: objectiveCompletionRate
        },
        keyResults: {
          total: parseInt(stats.total_key_results),
          completed: parseInt(stats.completed_key_results),
          averageProgress: parseFloat(stats.avg_key_result_progress || 0).toFixed(1),
          completionRate: keyResultCompletionRate
        },
        tasks: {
          total: parseInt(stats.total_tasks),
          completed: parseInt(stats.completed_tasks),
          inProgress: parseInt(stats.in_progress_tasks),
          todo: parseInt(stats.todo_tasks),
          completionRate: taskCompletionRate
        },
        timeTracking: {
          totalEstimatedHours: parseFloat(stats.total_estimated_hours || 0),
          totalActualHours: parseFloat(stats.total_actual_hours || 0)
        }
      }
    }

    res.json(this.buildSuccessResponse(responseData))
  }

  // 获取分类统计
  static async getCategoryStats(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const categoryStatsQuery = `
      SELECT 
        category,
        COUNT(*) as total_objectives,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_objectives,
        AVG(progress) as avg_progress
      FROM objectives 
      WHERE user_id = $1
      GROUP BY category
      ORDER BY total_objectives DESC
    `

    const categoryStatsResult = await pool.query(categoryStatsQuery, [userId])

    const categoryStats = categoryStatsResult.rows.map(row => ({
      category: row.category,
      totalObjectives: parseInt(row.total_objectives),
      completedObjectives: parseInt(row.completed_objectives),
      completionRate: row.total_objectives > 0 
        ? Math.round((row.completed_objectives / row.total_objectives) * 100)
        : 0,
      averageProgress: parseFloat(row.avg_progress || 0).toFixed(1)
    }))

    res.json(this.buildSuccessResponse({ categoryStats }))
  }

  // 获取时间趋势统计
  static async getTimeTrendStats(req: Request, res: Response) {
    const userId = this.validateUser(req)
    const { period = '30' } = req.query

    const periodDays = parseInt(period as string)
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      throw createValidationError('时间段必须在1-365天之间')
    }

    // 获取目标创建趋势
    const objectiveTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created_objectives,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_objectives
      FROM objectives 
      WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    // 获取任务完成趋势
    const taskTrendQuery = `
      SELECT 
        DATE(t.completed_at) as date,
        COUNT(*) as completed_tasks
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      WHERE o.user_id = $1 
        AND t.status = 'COMPLETED'
        AND t.completed_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      GROUP BY DATE(t.completed_at)
      ORDER BY date
    `

    const [objectiveTrendResult, taskTrendResult] = await Promise.all([
      pool.query(objectiveTrendQuery, [userId]),
      pool.query(taskTrendQuery, [userId])
    ])

    const responseData = {
      period: periodDays,
      objectiveTrend: objectiveTrendResult.rows.map(row => ({
        date: row.date,
        createdObjectives: parseInt(row.created_objectives),
        completedObjectives: parseInt(row.completed_objectives)
      })),
      taskTrend: taskTrendResult.rows.map(row => ({
        date: row.date,
        completedTasks: parseInt(row.completed_tasks)
      }))
    }

    res.json(this.buildSuccessResponse(responseData))
  }

  // 获取优先级统计
  static async getPriorityStats(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const priorityStatsQuery = `
      SELECT 
        t.priority,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tasks,
        AVG(CASE WHEN t.status = 'COMPLETED' AND t.actual_hours IS NOT NULL 
          THEN t.actual_hours END) as avg_completion_hours
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      WHERE o.user_id = $1
      GROUP BY t.priority
      ORDER BY 
        CASE t.priority 
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END
    `

    const priorityStatsResult = await pool.query(priorityStatsQuery, [userId])

    const priorityStats = priorityStatsResult.rows.map(row => ({
      priority: row.priority,
      totalTasks: parseInt(row.total_tasks),
      completedTasks: parseInt(row.completed_tasks),
      completionRate: row.total_tasks > 0
        ? Math.round((row.completed_tasks / row.total_tasks) * 100)
        : 0,
      averageCompletionHours: parseFloat(row.avg_completion_hours || 0).toFixed(1)
    }))

    res.json(this.buildSuccessResponse({ priorityStats }))
  }

  // 获取进度详情
  static async getProgressDetails(req: Request, res: Response) {
    const userId = this.validateUser(req)

    // 获取最近更新的目标
    const recentObjectivesQuery = `
      SELECT 
        id, title, category, status, progress, updated_at
      FROM objectives 
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 5
    `

    // 获取即将到期的任务
    const upcomingTasksQuery = `
      SELECT 
        t.id, t.title, t.due_date, t.priority, t.status,
        o.title as objective_title
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      WHERE o.user_id = $1 
        AND t.status IN ('TODO', 'IN_PROGRESS')
        AND t.due_date IS NOT NULL
        AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY t.due_date ASC
      LIMIT 10
    `

    // 获取最近完成的任务
    const recentCompletedTasksQuery = `
      SELECT 
        t.id, t.title, t.completed_at, t.priority,
        o.title as objective_title
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      WHERE o.user_id = $1 
        AND t.status = 'COMPLETED'
        AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY t.completed_at DESC
      LIMIT 10
    `

    const [recentObjectivesResult, upcomingTasksResult, recentCompletedTasksResult] = await Promise.all([
      pool.query(recentObjectivesQuery, [userId]),
      pool.query(upcomingTasksQuery, [userId]),
      pool.query(recentCompletedTasksQuery, [userId])
    ])

    const responseData = {
      recentObjectives: recentObjectivesResult.rows.map(obj => ({
        id: obj.id,
        title: obj.title,
        category: obj.category,
        status: obj.status,
        progress: parseFloat(obj.progress),
        updatedAt: obj.updated_at
      })),
      upcomingTasks: upcomingTasksResult.rows.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.due_date,
        priority: task.priority,
        status: task.status,
        objectiveTitle: task.objective_title
      })),
      recentCompletedTasks: recentCompletedTasksResult.rows.map(task => ({
        id: task.id,
        title: task.title,
        completedAt: task.completed_at,
        priority: task.priority,
        objectiveTitle: task.objective_title
      }))
    }

    res.json(this.buildSuccessResponse(responseData))
  }

  // 获取性能指标
  static async getPerformanceMetrics(req: Request, res: Response) {
    const userId = this.validateUser(req)

    const metricsQuery = `
      SELECT 
        -- 效率指标
        COUNT(CASE WHEN t.status = 'COMPLETED' AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as tasks_completed_last_week,
        COUNT(CASE WHEN t.status = 'COMPLETED' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as tasks_completed_last_month,
        
        -- 准时完成率
        COUNT(CASE WHEN t.status = 'COMPLETED' AND t.due_date IS NOT NULL AND t.completed_at <= t.due_date THEN 1 END) as on_time_completions,
        COUNT(CASE WHEN t.status = 'COMPLETED' AND t.due_date IS NOT NULL THEN 1 END) as total_completed_with_due_date,
        
        -- 平均完成时间
        AVG(CASE WHEN t.status = 'COMPLETED' AND t.estimated_hours IS NOT NULL AND t.actual_hours IS NOT NULL 
          THEN t.actual_hours - t.estimated_hours END) as avg_time_variance,
        
        -- 目标达成率
        AVG(CASE WHEN o.status = 'COMPLETED' THEN o.progress END) as avg_completed_objective_progress
        
      FROM tasks t
      JOIN objectives o ON t.objective_id = o.id
      WHERE o.user_id = $1
    `

    const metricsResult = await pool.query(metricsQuery, [userId])
    const metrics = metricsResult.rows[0]

    const onTimeRate = metrics.total_completed_with_due_date > 0
      ? Math.round((metrics.on_time_completions / metrics.total_completed_with_due_date) * 100)
      : 0

    const responseData = {
      productivity: {
        tasksCompletedLastWeek: parseInt(metrics.tasks_completed_last_week),
        tasksCompletedLastMonth: parseInt(metrics.tasks_completed_last_month),
        weeklyProductivityTrend: metrics.tasks_completed_last_week > 0 ? 'positive' : 'neutral'
      },
      efficiency: {
        onTimeCompletionRate: onTimeRate,
        averageTimeVariance: parseFloat(metrics.avg_time_variance || 0).toFixed(1),
        timeVarianceTrend: (metrics.avg_time_variance || 0) < 0 ? 'positive' : 'negative'
      },
      quality: {
        averageObjectiveProgress: parseFloat(metrics.avg_completed_objective_progress || 0).toFixed(1),
        completionQuality: parseFloat(metrics.avg_completed_objective_progress || 0) >= 95 ? 'excellent' : 'good'
      }
    }

    res.json(this.buildSuccessResponse(responseData))
  }
} 