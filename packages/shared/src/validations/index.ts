import { z } from 'zod';
import { ObjectiveCategory, Priority, ObjectiveStatus, TaskStatus } from '../types';

// 基础验证规则
export const emailSchema = z.string().email('邮箱格式不正确');
export const passwordSchema = z.string().min(8, '密码至少需要8位字符');
export const usernameSchema = z.string().min(3, '用户名至少需要3位字符').max(50, '用户名不能超过50位字符');

// 用户相关验证
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码不能为空'),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// 目标相关验证
export const createObjectiveSchema = z.object({
  title: z.string().min(3, '目标标题不能少于3个字符').max(200, '目标标题不能超过200字符'),
  description: z.string().max(2000, '目标描述不能超过2000字符').optional(),
  category: z.nativeEnum(ObjectiveCategory, { errorMap: () => ({ message: '请选择有效的目标分类' }) }),
  priority: z.nativeEnum(Priority, { errorMap: () => ({ message: '请选择有效的优先级' }) }),
  startDate: z.date({ errorMap: () => ({ message: '请选择有效的开始日期' }) }),
  targetDate: z.date().optional(),
}).refine(
  (data) => !data.targetDate || data.targetDate >= data.startDate,
  {
    message: '目标完成日期不能早于开始日期',
    path: ['targetDate'],
  }
);

export const updateObjectiveSchema = z.object({
  title: z.string().min(1, '目标标题不能为空').max(200, '目标标题不能超过200字符').optional(),
  description: z.string().max(2000, '目标描述不能超过2000字符').optional(),
  category: z.nativeEnum(ObjectiveCategory).optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(ObjectiveStatus).optional(),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
});

// 任务相关验证
export const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(200, '任务标题不能超过200字符'),
  description: z.string().max(2000, '任务描述不能超过2000字符').optional(),
  priority: z.nativeEnum(Priority, { errorMap: () => ({ message: '请选择有效的优先级' }) }),
  dueDate: z.date().optional(),
  estimatedDuration: z.number().min(1, '预估时长至少为1分钟').max(1440, '预估时长不能超过24小时').optional(),
  objectiveId: z.string().min(1, '必须关联到一个目标'),
  tags: z.array(z.string().max(20, '标签长度不能超过20字符')).max(10, '标签数量不能超过10个').optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(200, '任务标题不能超过200字符').optional(),
  description: z.string().max(2000, '任务描述不能超过2000字符').optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.date().optional(),
  estimatedDuration: z.number().min(1).max(1440).optional(),
  actualDuration: z.number().min(1).max(1440).optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
  dependencies: z.array(z.string()).max(10, '依赖任务数量不能超过10个').optional(),
});

// 分页验证
export const paginationSchema = z.object({
  page: z.number().min(1, '页码必须大于0'),
  limit: z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// 查询参数验证
export const objectiveQuerySchema = z.object({
  status: z.nativeEnum(ObjectiveStatus).optional(),
  category: z.nativeEnum(ObjectiveCategory).optional(),
  priority: z.nativeEnum(Priority).optional(),
  search: z.string().max(100).optional(),
}).merge(paginationSchema);

export const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  objectiveId: z.string().optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
}).merge(paginationSchema);

// 导出类型
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ObjectiveQueryInput = z.infer<typeof objectiveQuerySchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>; 
