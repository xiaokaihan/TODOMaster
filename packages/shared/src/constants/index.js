"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGEX_PATTERNS = exports.THEME = exports.STORAGE_KEYS = exports.APP_CONFIG = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.API_ROUTES = void 0;
// API 路径常量
exports.API_ROUTES = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        REFRESH: '/api/auth/refresh',
        LOGOUT: '/api/auth/logout',
        PROFILE: '/api/auth/profile',
    },
    OBJECTIVES: {
        BASE: '/api/objectives',
        BY_ID: (id) => `/api/objectives/${id}`,
        TASKS: (id) => `/api/objectives/${id}/tasks`,
        STATISTICS: (id) => `/api/objectives/${id}/statistics`,
    },
    TASKS: {
        BASE: '/api/tasks',
        BY_ID: (id) => `/api/tasks/${id}`,
        COMPLETE: (id) => `/api/tasks/${id}/complete`,
        START: (id) => `/api/tasks/${id}/start`,
    },
    USERS: {
        PROFILE: '/api/users/profile',
        STATISTICS: '/api/users/statistics',
        TIMELINE: '/api/users/timeline',
    },
};
// 错误消息常量
exports.ERROR_MESSAGES = {
    AUTH: {
        INVALID_CREDENTIALS: '邮箱或密码错误',
        TOKEN_EXPIRED: '登录已过期，请重新登录',
        UNAUTHORIZED: '未授权访问',
        EMAIL_EXISTS: '邮箱已被注册',
        WEAK_PASSWORD: '密码强度不足',
    },
    VALIDATION: {
        REQUIRED_FIELD: '此字段为必填项',
        INVALID_EMAIL: '邮箱格式不正确',
        INVALID_DATE: '日期格式不正确',
        INVALID_PRIORITY: '优先级选择无效',
        TASK_NEEDS_OBJECTIVE: '任务必须关联到一个目标',
    },
    GENERAL: {
        NETWORK_ERROR: '网络连接错误，请稍后重试',
        SERVER_ERROR: '服务器错误，请稍后重试',
        NOT_FOUND: '请求的资源不存在',
        PERMISSION_DENIED: '没有权限执行此操作',
    },
};
// 成功消息常量
exports.SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: '登录成功',
        REGISTER_SUCCESS: '注册成功',
        LOGOUT_SUCCESS: '已安全退出',
    },
    OBJECTIVE: {
        CREATED: '目标创建成功',
        UPDATED: '目标更新成功',
        DELETED: '目标删除成功',
        COMPLETED: '恭喜！目标已完成',
    },
    TASK: {
        CREATED: '任务创建成功',
        UPDATED: '任务更新成功',
        DELETED: '任务删除成功',
        COMPLETED: '任务已完成',
        STARTED: '任务已开始',
    },
};
// 应用配置常量
exports.APP_CONFIG = {
    NAME: 'TODOMaster',
    VERSION: '1.0.0',
    DESCRIPTION: '个人任务管理系统',
    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
    },
    // 任务配置
    TASK: {
        MAX_TITLE_LENGTH: 200,
        MAX_DESCRIPTION_LENGTH: 2000,
        DEFAULT_ESTIMATED_DURATION: 60, // 分钟
        MAX_DEPENDENCIES: 10,
    },
    // 目标配置
    OBJECTIVE: {
        MAX_TITLE_LENGTH: 200,
        MAX_DESCRIPTION_LENGTH: 2000,
        MAX_ACTIVE_OBJECTIVES: 20,
    },
    // 用户配置
    USER: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_USERNAME_LENGTH: 50,
        AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    },
    // 时间配置
    TIME: {
        JWT_EXPIRY: '7d',
        REFRESH_TOKEN_EXPIRY: '30d',
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30分钟（毫秒）
    },
};
// 本地存储键名常量
exports.STORAGE_KEYS = {
    AUTH_TOKEN: 'todomaster_auth_token',
    REFRESH_TOKEN: 'todomaster_refresh_token',
    USER_PREFERENCES: 'todomaster_user_preferences',
    DRAFT_OBJECTIVE: 'todomaster_draft_objective',
    DRAFT_TASK: 'todomaster_draft_task',
    THEME: 'todomaster_theme',
    LANGUAGE: 'todomaster_language',
};
// 主题相关常量
exports.THEME = {
    COLORS: {
        PRIMARY: '#3B82F6', // 蓝色
        SECONDARY: '#6B7280', // 灰色
        SUCCESS: '#10B981', // 绿色
        WARNING: '#F59E0B', // 黄色
        ERROR: '#EF4444', // 红色
        INFO: '#3B82F6', // 蓝色
    },
    PRIORITY_COLORS: {
        LOW: '#10B981', // 绿色
        MEDIUM: '#F59E0B', // 黄色
        HIGH: '#F97316', // 橙色
        CRITICAL: '#EF4444', // 红色
    },
    STATUS_COLORS: {
        // 目标状态
        DRAFT: '#6B7280', // 灰色
        ACTIVE: '#3B82F6', // 蓝色
        ON_HOLD: '#F59E0B', // 黄色
        COMPLETED: '#10B981', // 绿色
        CANCELLED: '#EF4444', // 红色
        // 任务状态
        TODO: '#6B7280', // 灰色
        IN_PROGRESS: '#3B82F6', // 蓝色
        WAITING: '#F59E0B', // 黄色
    },
};
// 正则表达式常量
exports.REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
    TAG: /^[a-zA-Z0-9\u4e00-\u9fa5_-]{1,20}$/,
};
//# sourceMappingURL=index.js.map