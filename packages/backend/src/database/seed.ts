import { pool } from '../config/database'
import bcrypt from 'bcryptjs'

// 种子数据
const seedData = {
  users: [
    {
      email: 'admin@todomaster.com',
      password: 'admin123',
      name: 'TODOMaster Admin',
      role: 'admin'
    },
    {
      email: 'demo@todomaster.com',
      password: 'demo123',
      name: 'Demo User',
      role: 'user'
    },
    {
      email: 'john@example.com',
      password: 'john123',
      name: 'John Doe',
      role: 'user'
    }
  ],
  objectives: [
    {
      title: '提升个人技能',
      description: '通过学习新技术和参与项目来提升个人技能水平',
      category: 'LEARNING',
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    },
    {
      title: '健康生活方式',
      description: '建立健康的生活习惯，包括运动、饮食和睡眠',
      category: 'HEALTH',
      start_date: '2024-01-01',
      end_date: '2024-06-30'
    },
    {
      title: '工作项目完成',
      description: '按时完成Q1季度的重要工作项目',
      category: 'WORK',
      start_date: '2024-01-01',
      end_date: '2024-03-31'
    }
  ],
  keyResults: [
    {
      title: '完成React高级课程',
      description: '学习React高级特性和最佳实践',
      type: 'BOOLEAN',
      target_value: 1,
      current_value: 0,
      unit: '课程'
    },
    {
      title: '阅读技术书籍',
      description: '阅读至少5本技术相关书籍',
      type: 'NUMERIC',
      target_value: 5,
      current_value: 2,
      unit: '本'
    },
    {
      title: '每周运动次数',
      description: '每周至少运动3次',
      type: 'NUMERIC',
      target_value: 12,
      current_value: 8,
      unit: '次/月'
    },
    {
      title: '体重减少',
      description: '减重10%',
      type: 'PERCENTAGE',
      target_value: 10,
      current_value: 6,
      unit: '%'
    }
  ],
  tasks: [
    {
      title: '学习React Hooks',
      description: '深入学习useState, useEffect, useContext等Hooks',
      priority: 'HIGH',
      estimated_hours: 8,
      actual_hours: 6
    },
    {
      title: '完成项目原型',
      description: '设计并实现项目的基础原型',
      priority: 'URGENT',
      estimated_hours: 16,
      actual_hours: null,
      due_date: '2024-02-15T18:00:00Z'
    },
    {
      title: '制定运动计划',
      description: '制定详细的每周运动计划',
      priority: 'MEDIUM',
      estimated_hours: 2,
      actual_hours: 1.5
    },
    {
      title: '购买健身器材',
      description: '购买基础的家庭健身器材',
      priority: 'LOW',
      estimated_hours: 3,
      actual_hours: null
    }
  ],
  tags: [
    { name: '学习', color: '#3B82F6' },
    { name: '工作', color: '#EF4444' },
    { name: '健康', color: '#10B981' },
    { name: '紧急', color: '#F59E0B' },
    { name: '重要', color: '#8B5CF6' }
  ]
}

// 清理现有数据
const clearData = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    console.log('🧹 清理现有数据...')
    
    // 按依赖关系顺序删除
    await client.query('DELETE FROM task_tag_associations')
    await client.query('DELETE FROM task_dependencies')
    await client.query('DELETE FROM activity_logs')
    await client.query('DELETE FROM task_tags')
    await client.query('DELETE FROM tasks')
    await client.query('DELETE FROM key_results')
    await client.query('DELETE FROM objectives')
    await client.query('DELETE FROM users WHERE email NOT IN ($1, $2)', [
      'admin@todomaster.com',
      'demo@todomaster.com'
    ])
    
    await client.query('COMMIT')
    console.log('✅ 数据清理完成')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 数据清理失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 插入用户数据
const seedUsers = async (): Promise<string[]> => {
  const client = await pool.connect()
  const userIds: string[] = []
  
  try {
    console.log('👥 插入用户数据...')
    
    for (const user of seedData.users) {
      const hashedPassword = await bcrypt.hash(user.password, 12)
      
      const result = await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role
        RETURNING id
      `, [user.email, hashedPassword, user.name, user.role])
      
      userIds.push(result.rows[0].id)
      console.log(`  ✅ 用户 ${user.name} (${user.email})`)
    }
    
    return userIds
  } catch (error) {
    console.error('❌ 用户数据插入失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 插入目标数据
const seedObjectives = async (userId: string): Promise<string[]> => {
  const client = await pool.connect()
  const objectiveIds: string[] = []
  
  try {
    console.log('🎯 插入目标数据...')
    
    for (const objective of seedData.objectives) {
      const result = await client.query(`
        INSERT INTO objectives (user_id, title, description, category, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, objective.title, objective.description, objective.category, objective.start_date, objective.end_date])
      
      objectiveIds.push(result.rows[0].id)
      console.log(`  ✅ 目标: ${objective.title}`)
    }
    
    return objectiveIds
  } catch (error) {
    console.error('❌ 目标数据插入失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 插入关键结果数据
const seedKeyResults = async (objectiveIds: string[]): Promise<string[]> => {
  const client = await pool.connect()
  const keyResultIds: string[] = []
  
  try {
    console.log('🔑 插入关键结果数据...')
    
    for (let i = 0; i < seedData.keyResults.length; i++) {
      const keyResult = seedData.keyResults[i]
      const objectiveId = objectiveIds[i % objectiveIds.length]
      
      const result = await client.query(`
        INSERT INTO key_results (objective_id, title, description, type, target_value, current_value, unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [objectiveId, keyResult.title, keyResult.description, keyResult.type, keyResult.target_value, keyResult.current_value, keyResult.unit])
      
      keyResultIds.push(result.rows[0].id)
      console.log(`  ✅ 关键结果: ${keyResult.title}`)
    }
    
    return keyResultIds
  } catch (error) {
    console.error('❌ 关键结果数据插入失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 插入任务数据
const seedTasks = async (objectiveIds: string[], keyResultIds: string[]): Promise<string[]> => {
  const client = await pool.connect()
  const taskIds: string[] = []
  
  try {
    console.log('📋 插入任务数据...')
    
    for (let i = 0; i < seedData.tasks.length; i++) {
      const task = seedData.tasks[i]
      const objectiveId = objectiveIds[i % objectiveIds.length]
      const keyResultId = i < keyResultIds.length ? keyResultIds[i] : null
      
      const result = await client.query(`
        INSERT INTO tasks (objective_id, key_result_id, title, description, priority, estimated_hours, actual_hours, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [objectiveId, keyResultId, task.title, task.description, task.priority, task.estimated_hours, task.actual_hours, task.due_date || null])
      
      taskIds.push(result.rows[0].id)
      console.log(`  ✅ 任务: ${task.title}`)
    }
    
    return taskIds
  } catch (error) {
    console.error('❌ 任务数据插入失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 插入标签数据
const seedTags = async (userId: string, taskIds: string[]): Promise<void> => {
  const client = await pool.connect()
  
  try {
    console.log('🏷️  插入标签数据...')
    
    const tagIds: string[] = []
    
    // 创建标签
    for (const tag of seedData.tags) {
      const result = await client.query(`
        INSERT INTO task_tags (user_id, name, color)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [userId, tag.name, tag.color])
      
      tagIds.push(result.rows[0].id)
      console.log(`  ✅ 标签: ${tag.name}`)
    }
    
    // 为任务分配标签
    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i]
      const tagId = tagIds[i % tagIds.length]
      
      await client.query(`
        INSERT INTO task_tag_associations (task_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [taskId, tagId])
    }
    
    console.log('  ✅ 标签关联完成')
  } catch (error) {
    console.error('❌ 标签数据插入失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// 主种子函数
export const runSeed = async (): Promise<void> => {
  try {
    console.log('🌱 开始数据库种子操作...')
    
    // 清理现有数据（除了管理员用户）
    await clearData()
    
    // 插入用户
    const userIds = await seedUsers()
    const demoUserId = userIds[1] // demo用户
    
    // 为demo用户插入示例数据
    const objectiveIds = await seedObjectives(demoUserId)
    const keyResultIds = await seedKeyResults(objectiveIds)
    const taskIds = await seedTasks(objectiveIds, keyResultIds)
    await seedTags(demoUserId, taskIds)
    
    console.log('🎉 数据库种子操作完成！')
    console.log('\n📊 插入的数据统计:')
    console.log(`  - 用户: ${userIds.length}`)
    console.log(`  - 目标: ${objectiveIds.length}`)
    console.log(`  - 关键结果: ${keyResultIds.length}`)
    console.log(`  - 任务: ${taskIds.length}`)
    console.log(`  - 标签: ${seedData.tags.length}`)
    
    console.log('\n🔑 测试账户:')
    console.log('  管理员: admin@todomaster.com / admin123')
    console.log('  演示用户: demo@todomaster.com / demo123')
    console.log('  普通用户: john@example.com / john123')
    
  } catch (error) {
    console.error('💥 种子操作失败:', error)
    throw error
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('✅ 种子操作成功完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 种子操作失败:', error)
      process.exit(1)
    })
} 