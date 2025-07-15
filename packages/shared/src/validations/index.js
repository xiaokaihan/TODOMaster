"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQuerySchema = exports.objectiveQuerySchema = exports.paginationSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateObjectiveSchema = exports.createObjectiveSchema = exports.registerSchema = exports.loginSchema = exports.usernameSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// 基础验证规则
exports.emailSchema = zod_1.z.string().email('邮箱格式不正确');
exports.passwordSchema = zod_1.z.string().min(8, '密码至少需要8位字符');
exports.usernameSchema = zod_1.z.string().min(3, '用户名至少需要3位字符').max(50, '用户名不能超过50位字符');
// 用户相关验证
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, '密码不能为空'),
});
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    username: exports.usernameSchema,
    password: exports.passwordSchema,
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
});
// 目标相关验证
exports.createObjectiveSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '目标标题不能为空').max(200, '目标标题不能超过200字符'),
    description: zod_1.z.string().max(2000, '目标描述不能超过2000字符').optional(),
    category: zod_1.z.nativeEnum(types_1.ObjectiveCategory, { errorMap: () => ({ message: '请选择有效的目标分类' }) }),
    priority: zod_1.z.nativeEnum(types_1.Priority, { errorMap: () => ({ message: '请选择有效的优先级' }) }),
    startDate: zod_1.z.date({ errorMap: () => ({ message: '请选择有效的开始日期' }) }),
    targetDate: zod_1.z.date().optional(),
}).refine((data) => !data.targetDate || data.targetDate >= data.startDate, {
    message: '目标完成日期不能早于开始日期',
    path: ['targetDate'],
});
exports.updateObjectiveSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '目标标题不能为空').max(200, '目标标题不能超过200字符').optional(),
    description: zod_1.z.string().max(2000, '目标描述不能超过2000字符').optional(),
    category: zod_1.z.nativeEnum(types_1.ObjectiveCategory).optional(),
    priority: zod_1.z.nativeEnum(types_1.Priority).optional(),
    status: zod_1.z.nativeEnum(types_1.ObjectiveStatus).optional(),
    startDate: zod_1.z.date().optional(),
    targetDate: zod_1.z.date().optional(),
});
// 任务相关验证
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '任务标题不能为空').max(200, '任务标题不能超过200字符'),
    description: zod_1.z.string().max(2000, '任务描述不能超过2000字符').optional(),
    priority: zod_1.z.nativeEnum(types_1.Priority, { errorMap: () => ({ message: '请选择有效的优先级' }) }),
    dueDate: zod_1.z.date().optional(),
    estimatedDuration: zod_1.z.number().min(1, '预估时长至少为1分钟').max(1440, '预估时长不能超过24小时').optional(),
    objectiveId: zod_1.z.string().min(1, '必须关联到一个目标'),
    tags: zod_1.z.array(zod_1.z.string().max(20, '标签长度不能超过20字符')).max(10, '标签数量不能超过10个').optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '任务标题不能为空').max(200, '任务标题不能超过200字符').optional(),
    description: zod_1.z.string().max(2000, '任务描述不能超过2000字符').optional(),
    priority: zod_1.z.nativeEnum(types_1.Priority).optional(),
    status: zod_1.z.nativeEnum(types_1.TaskStatus).optional(),
    dueDate: zod_1.z.date().optional(),
    estimatedDuration: zod_1.z.number().min(1).max(1440).optional(),
    actualDuration: zod_1.z.number().min(1).max(1440).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(20)).max(10).optional(),
    dependencies: zod_1.z.array(zod_1.z.string()).max(10, '依赖任务数量不能超过10个').optional(),
});
// 分页验证
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1, '页码必须大于0'),
    limit: zod_1.z.number().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100'),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
// 查询参数验证
exports.objectiveQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(types_1.ObjectiveStatus).optional(),
    category: zod_1.z.nativeEnum(types_1.ObjectiveCategory).optional(),
    priority: zod_1.z.nativeEnum(types_1.Priority).optional(),
    search: zod_1.z.string().max(100).optional(),
}).merge(exports.paginationSchema);
exports.taskQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(types_1.TaskStatus).optional(),
    priority: zod_1.z.nativeEnum(types_1.Priority).optional(),
    objectiveId: zod_1.z.string().optional(),
    search: zod_1.z.string().max(100).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
}).merge(exports.paginationSchema);
//# sourceMappingURL=index.js.map