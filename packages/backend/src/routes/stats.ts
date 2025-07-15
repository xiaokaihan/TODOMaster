import { Router, Request, Response } from 'express'
import { pool } from '../config/database'
import { asyncHandler, createValidationError } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = Router()

// 获取用户总体统计
router.get('/overview', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  // 获取总体统计数据
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM objectives WHERE user_id = $1) as total_objectives,
      (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'COMPLETED') as completed_objectives,
      (SELECT COUNT(*) FROM objectives WHERE user_id = $1 AND status = 'IN_PROGRESS') as active_objectives,
      (SELECT COUNT(*) FROM key_results kr JOIN objectives o ON kr.objective_id = o.id WHERE o.user_id = $1) as total_key_results,
      (SELECT COUNT(*) FROM key_results kr JOIN objectives o ON kr.objective_id = o.id WHERE o.user_id = $1 AND kr.status = 'COMPLETED') as completed_key_results,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1) as total_tasks,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'COMPLETED') as completed_tasks,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.status = 'IN_PROGRESS') as active_tasks,
      (SELECT COUNT(*) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.due_date < CURRENT_TIMESTAMP AND t.status != 'COMPLETED') as overdue_tasks,
      (SELECT COALESCE(AVG(progress), 0) FROM objectives WHERE user_id = $1) as avg_objective_progress,
      (SELECT COALESCE(SUM(actual_hours), 0) FROM tasks t JOIN objectives o ON t.objective_id = o.id WHERE o.user_id = $1 AND t.actual_hours IS NOT NULL) as total_hours_spent
  `

  const statsResult = await pool.query(statsQuery, [req.user.id])
  const stats = statsResult.rows[0]

  // 计算完成率
  const objectiveCompletionRate = stats.total_objectives > 0 ? 
    (parseInt(stats.completed_objectives) / parseInt(stats.total_objectives) * 100) : 0
  
  const keyResultCompletionRate = stats.total_key_results > 0 ? 
    (parseInt(stats.completed_key_results) / parseInt(stats.total_key_results) * 100) : 0
  
  const taskCompletionRate = stats.total_tasks > 0 ? 
    (parseInt(stats.completed_tasks) / parseInt(stats.total_tasks) * 100) : 0

  res.json({
    success: true,
    data: {
      overview: {
        objectives: {
          total: parseInt(stats.total_objectives),
          completed: parseInt(stats.completed_objectives),
          active: parseInt(stats.active_objectives),
          completionRate: Math.round(objectiveCompletionRate * 100) / 100
        },
        keyResults: {
          total: parseInt(stats.total_key_results),
          completed: parseInt(stats.completed_key_results),
          completionRate: Math.round(keyResultCompletionRate * 100) / 100
        },
        tasks: {
          total: parseInt(stats.total_tasks),
          completed: parseInt(stats.completed_tasks),
          active: parseInt(stats.active_tasks),
          overdue: parseInt(stats.overdue_tasks),
          completionRate: Math.round(taskCompletionRate * 100) / 100
        },
        productivity: {
          avgObjectiveProgress: Math.round(parseFloat(stats.avg_objective_progress) * 100) / 100,
          totalHoursSpent: parseFloat(stats.total_hours_spent)
        }
      }
    }
  })
}))

// 获取目标分类统计
router.get('/objectives/categories', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const categoryStatsQuery = `
    SELECT 
      category,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
      COALESCE(AVG(progress), 0) as avg_progress
    FROM objectives 
    WHERE user_id = $1
    GROUP BY category
    ORDER BY total DESC
  `

  const result = await pool.query(categoryStatsQuery, [req.user.id])

  const categories = result.rows.map(row => ({
    category: row.category,
    total: parseInt(row.total),
    completed: parseInt(row.completed),
    inProgress: parseInt(row.in_progress),
    avgProgress: Math.round(parseFloat(row.avg_progress) * 100) / 100,
    completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 10000) / 100 : 0
  }))

  res.json({
    success: true,
    data: { categories }
  })
}))

// 获取任务优先级统计
router.get('/tasks/priorities', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const priorityStatsQuery = `
    SELECT 
      t.priority,
      COUNT(*) as total,
      COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
      COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND t.status != 'COMPLETED' THEN 1 END) as overdue,
      COALESCE(AVG(t.actual_hours), 0) as avg_hours
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

  const result = await pool.query(priorityStatsQuery, [req.user.id])

  const priorities = result.rows.map(row => ({
    priority: row.priority,
    total: parseInt(row.total),
    completed: parseInt(row.completed),
    inProgress: parseInt(row.in_progress),
    overdue: parseInt(row.overdue),
    avgHours: Math.round(parseFloat(row.avg_hours) * 100) / 100,
    completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 10000) / 100 : 0
  }))

  res.json({
    success: true,
    data: { priorities }
  })
}))

// 获取时间趋势分析
router.get('/trends', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const days = parseInt(req.query.days as string) || 30
  
  // 获取过去N天的活动趋势
  const trendsQuery = `
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '${days} days',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date as date
    ),
    daily_stats AS (
      SELECT 
        ds.date,
        COALESCE(obj_created.count, 0) as objectives_created,
        COALESCE(obj_completed.count, 0) as objectives_completed,
        COALESCE(kr_created.count, 0) as key_results_created,
        COALESCE(kr_completed.count, 0) as key_results_completed,
        COALESCE(tasks_created.count, 0) as tasks_created,
        COALESCE(tasks_completed.count, 0) as tasks_completed,
        COALESCE(hours_logged.total, 0) as hours_logged
      FROM date_series ds
      LEFT JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM objectives 
        WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      ) obj_created ON ds.date = obj_created.date
      LEFT JOIN (
        SELECT DATE(updated_at) as date, COUNT(*) as count
        FROM objectives 
        WHERE user_id = $1 AND status = 'COMPLETED' 
          AND updated_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(updated_at)
      ) obj_completed ON ds.date = obj_completed.date
      LEFT JOIN (
        SELECT DATE(kr.created_at) as date, COUNT(*) as count
        FROM key_results kr
        JOIN objectives o ON kr.objective_id = o.id
        WHERE o.user_id = $1 AND kr.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(kr.created_at)
      ) kr_created ON ds.date = kr_created.date
      LEFT JOIN (
        SELECT DATE(kr.updated_at) as date, COUNT(*) as count
        FROM key_results kr
        JOIN objectives o ON kr.objective_id = o.id
        WHERE o.user_id = $1 AND kr.status = 'COMPLETED' 
          AND kr.updated_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(kr.updated_at)
      ) kr_completed ON ds.date = kr_completed.date
      LEFT JOIN (
        SELECT DATE(t.created_at) as date, COUNT(*) as count
        FROM tasks t
        JOIN objectives o ON t.objective_id = o.id
        WHERE o.user_id = $1 AND t.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(t.created_at)
      ) tasks_created ON ds.date = tasks_created.date
      LEFT JOIN (
        SELECT DATE(t.completed_at) as date, COUNT(*) as count
        FROM tasks t
        JOIN objectives o ON t.objective_id = o.id
        WHERE o.user_id = $1 AND t.status = 'COMPLETED' 
          AND t.completed_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(t.completed_at)
      ) tasks_completed ON ds.date = tasks_completed.date
      LEFT JOIN (
        SELECT DATE(t.updated_at) as date, COALESCE(SUM(t.actual_hours), 0) as total
        FROM tasks t
        JOIN objectives o ON t.objective_id = o.id
        WHERE o.user_id = $1 AND t.actual_hours IS NOT NULL
          AND t.updated_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(t.updated_at)
      ) hours_logged ON ds.date = hours_logged.date
      ORDER BY ds.date
    )
    SELECT * FROM daily_stats
  `

  const result = await pool.query(trendsQuery, [req.user.id])

  const trends = result.rows.map(row => ({
    date: row.date,
    objectivesCreated: parseInt(row.objectives_created),
    objectivesCompleted: parseInt(row.objectives_completed),
    keyResultsCreated: parseInt(row.key_results_created),
    keyResultsCompleted: parseInt(row.key_results_completed),
    tasksCreated: parseInt(row.tasks_created),
    tasksCompleted: parseInt(row.tasks_completed),
    hoursLogged: parseFloat(row.hours_logged)
  }))

  res.json({
    success: true,
    data: { trends }
  })
}))

// 获取生产力分析
router.get('/productivity', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  // 获取时间估算准确性
  const estimationAccuracyQuery = `
    SELECT 
      COUNT(*) as total_tasks_with_estimates,
      COALESCE(AVG(
        CASE 
          WHEN actual_hours IS NOT NULL AND estimated_hours IS NOT NULL AND estimated_hours > 0 
          THEN ABS(actual_hours - estimated_hours) / estimated_hours * 100
          ELSE NULL
        END
      ), 0) as avg_estimation_error_percent,
      COALESCE(AVG(
        CASE 
          WHEN actual_hours IS NOT NULL AND estimated_hours IS NOT NULL 
          THEN actual_hours / estimated_hours
          ELSE NULL
        END
      ), 0) as avg_estimation_ratio
    FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE o.user_id = $1 
      AND t.status = 'COMPLETED'
      AND t.estimated_hours IS NOT NULL 
      AND t.actual_hours IS NOT NULL
      AND t.estimated_hours > 0
  `

  const estimationResult = await pool.query(estimationAccuracyQuery, [req.user.id])
  const estimation = estimationResult.rows[0]

  // 获取任务完成速度分析
  const velocityQuery = `
    SELECT 
      COUNT(*) as completed_tasks_last_30_days,
      COALESCE(AVG(
        EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600
      ), 0) as avg_completion_time_hours,
      COALESCE(AVG(actual_hours), 0) as avg_actual_hours
    FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE o.user_id = $1 
      AND t.status = 'COMPLETED'
      AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days'
  `

  const velocityResult = await pool.query(velocityQuery, [req.user.id])
  const velocity = velocityResult.rows[0]

  // 获取每日生产力模式
  const dailyPatternQuery = `
    SELECT 
      EXTRACT(DOW FROM completed_at) as day_of_week,
      COUNT(*) as tasks_completed,
      COALESCE(AVG(actual_hours), 0) as avg_hours
    FROM tasks t
    JOIN objectives o ON t.objective_id = o.id
    WHERE o.user_id = $1 
      AND t.status = 'COMPLETED'
      AND t.completed_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY EXTRACT(DOW FROM completed_at)
    ORDER BY day_of_week
  `

  const dailyPatternResult = await pool.query(dailyPatternQuery, [req.user.id])
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dailyPattern = dailyPatternResult.rows.map(row => ({
    dayOfWeek: dayNames[parseInt(row.day_of_week)],
    tasksCompleted: parseInt(row.tasks_completed),
    avgHours: Math.round(parseFloat(row.avg_hours) * 100) / 100
  }))

  res.json({
    success: true,
    data: {
      productivity: {
        estimation: {
          totalTasksWithEstimates: parseInt(estimation.total_tasks_with_estimates),
          avgEstimationErrorPercent: Math.round(parseFloat(estimation.avg_estimation_error_percent) * 100) / 100,
          avgEstimationRatio: Math.round(parseFloat(estimation.avg_estimation_ratio) * 100) / 100
        },
        velocity: {
          completedTasksLast30Days: parseInt(velocity.completed_tasks_last_30_days),
          avgCompletionTimeHours: Math.round(parseFloat(velocity.avg_completion_time_hours) * 100) / 100,
          avgActualHours: Math.round(parseFloat(velocity.avg_actual_hours) * 100) / 100
        },
        dailyPattern
      }
    }
  })
}))

// 获取目标进度报告
router.get('/objectives/progress', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createValidationError('用户信息不存在')
  }

  const status = req.query.status as string || ''
  const category = req.query.category as string || ''

  let whereConditions = ['user_id = $1']
  let queryParams: any[] = [req.user.id]
  let paramIndex = 2

  if (status) {
    whereConditions.push(`status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  if (category) {
    whereConditions.push(`category = $${paramIndex}`)
    queryParams.push(category)
    paramIndex++
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`

  const progressQuery = `
    SELECT 
      o.id,
      o.title,
      o.category,
      o.status,
      o.progress,
      o.start_date,
      o.end_date,
      (SELECT COUNT(*) FROM key_results WHERE objective_id = o.id) as total_key_results,
      (SELECT COUNT(*) FROM key_results WHERE objective_id = o.id AND status = 'COMPLETED') as completed_key_results,
      (SELECT COUNT(*) FROM tasks WHERE objective_id = o.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE objective_id = o.id AND status = 'COMPLETED') as completed_tasks,
      CASE 
        WHEN o.end_date IS NOT NULL AND o.end_date < CURRENT_DATE AND o.status != 'COMPLETED' 
        THEN true 
        ELSE false 
      END as is_overdue,
      CASE 
        WHEN o.start_date IS NOT NULL AND o.end_date IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (CURRENT_DATE - o.start_date)) / EXTRACT(EPOCH FROM (o.end_date - o.start_date)) * 100
        ELSE NULL 
      END as time_progress_percent
    FROM objectives o
    ${whereClause}
    ORDER BY o.progress ASC, o.created_at DESC
  `

  const result = await pool.query(progressQuery, queryParams)

  const objectives = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    progress: parseFloat(row.progress),
    startDate: row.start_date,
    endDate: row.end_date,
    isOverdue: row.is_overdue,
    timeProgressPercent: row.time_progress_percent ? Math.round(parseFloat(row.time_progress_percent) * 100) / 100 : null,
    keyResults: {
      total: parseInt(row.total_key_results),
      completed: parseInt(row.completed_key_results),
      completionRate: row.total_key_results > 0 ? 
        Math.round((row.completed_key_results / row.total_key_results) * 10000) / 100 : 0
    },
    tasks: {
      total: parseInt(row.total_tasks),
      completed: parseInt(row.completed_tasks),
      completionRate: row.total_tasks > 0 ? 
        Math.round((row.completed_tasks / row.total_tasks) * 10000) / 100 : 0
    }
  }))

  res.json({
    success: true,
    data: { objectives }
  })
}))

export default router 