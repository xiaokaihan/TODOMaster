export declare const API_ROUTES: {
    readonly AUTH: {
        readonly LOGIN: "/api/auth/login";
        readonly REGISTER: "/api/auth/register";
        readonly REFRESH: "/api/auth/refresh";
        readonly LOGOUT: "/api/auth/logout";
        readonly PROFILE: "/api/auth/profile";
    };
    readonly OBJECTIVES: {
        readonly BASE: "/api/objectives";
        readonly BY_ID: (id: string) => string;
        readonly TASKS: (id: string) => string;
        readonly STATISTICS: (id: string) => string;
    };
    readonly TASKS: {
        readonly BASE: "/api/tasks";
        readonly BY_ID: (id: string) => string;
        readonly COMPLETE: (id: string) => string;
        readonly START: (id: string) => string;
    };
    readonly USERS: {
        readonly PROFILE: "/api/users/profile";
        readonly STATISTICS: "/api/users/statistics";
        readonly TIMELINE: "/api/users/timeline";
    };
};
export declare const ERROR_MESSAGES: {
    readonly AUTH: {
        readonly INVALID_CREDENTIALS: "邮箱或密码错误";
        readonly TOKEN_EXPIRED: "登录已过期，请重新登录";
        readonly UNAUTHORIZED: "未授权访问";
        readonly EMAIL_EXISTS: "邮箱已被注册";
        readonly WEAK_PASSWORD: "密码强度不足";
    };
    readonly VALIDATION: {
        readonly REQUIRED_FIELD: "此字段为必填项";
        readonly INVALID_EMAIL: "邮箱格式不正确";
        readonly INVALID_DATE: "日期格式不正确";
        readonly INVALID_PRIORITY: "优先级选择无效";
        readonly TASK_NEEDS_OBJECTIVE: "任务必须关联到一个目标";
    };
    readonly GENERAL: {
        readonly NETWORK_ERROR: "网络连接错误，请稍后重试";
        readonly SERVER_ERROR: "服务器错误，请稍后重试";
        readonly NOT_FOUND: "请求的资源不存在";
        readonly PERMISSION_DENIED: "没有权限执行此操作";
    };
};
export declare const SUCCESS_MESSAGES: {
    readonly AUTH: {
        readonly LOGIN_SUCCESS: "登录成功";
        readonly REGISTER_SUCCESS: "注册成功";
        readonly LOGOUT_SUCCESS: "已安全退出";
    };
    readonly OBJECTIVE: {
        readonly CREATED: "目标创建成功";
        readonly UPDATED: "目标更新成功";
        readonly DELETED: "目标删除成功";
        readonly COMPLETED: "恭喜！目标已完成";
    };
    readonly TASK: {
        readonly CREATED: "任务创建成功";
        readonly UPDATED: "任务更新成功";
        readonly DELETED: "任务删除成功";
        readonly COMPLETED: "任务已完成";
        readonly STARTED: "任务已开始";
    };
};
export declare const APP_CONFIG: {
    readonly NAME: "TODOMaster";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "个人任务管理系统";
    readonly PAGINATION: {
        readonly DEFAULT_PAGE_SIZE: 20;
        readonly MAX_PAGE_SIZE: 100;
    };
    readonly TASK: {
        readonly MAX_TITLE_LENGTH: 200;
        readonly MAX_DESCRIPTION_LENGTH: 2000;
        readonly DEFAULT_ESTIMATED_DURATION: 60;
        readonly MAX_DEPENDENCIES: 10;
    };
    readonly OBJECTIVE: {
        readonly MAX_TITLE_LENGTH: 200;
        readonly MAX_DESCRIPTION_LENGTH: 2000;
        readonly MAX_ACTIVE_OBJECTIVES: 20;
    };
    readonly USER: {
        readonly MIN_PASSWORD_LENGTH: 8;
        readonly MAX_USERNAME_LENGTH: 50;
        readonly AVATAR_MAX_SIZE: number;
    };
    readonly TIME: {
        readonly JWT_EXPIRY: "7d";
        readonly REFRESH_TOKEN_EXPIRY: "30d";
        readonly SESSION_TIMEOUT: number;
    };
};
export declare const STORAGE_KEYS: {
    readonly AUTH_TOKEN: "todomaster_auth_token";
    readonly REFRESH_TOKEN: "todomaster_refresh_token";
    readonly USER_PREFERENCES: "todomaster_user_preferences";
    readonly DRAFT_OBJECTIVE: "todomaster_draft_objective";
    readonly DRAFT_TASK: "todomaster_draft_task";
    readonly THEME: "todomaster_theme";
    readonly LANGUAGE: "todomaster_language";
};
export declare const THEME: {
    readonly COLORS: {
        readonly PRIMARY: "#3B82F6";
        readonly SECONDARY: "#6B7280";
        readonly SUCCESS: "#10B981";
        readonly WARNING: "#F59E0B";
        readonly ERROR: "#EF4444";
        readonly INFO: "#3B82F6";
    };
    readonly PRIORITY_COLORS: {
        readonly LOW: "#10B981";
        readonly MEDIUM: "#F59E0B";
        readonly HIGH: "#F97316";
        readonly CRITICAL: "#EF4444";
    };
    readonly STATUS_COLORS: {
        readonly DRAFT: "#6B7280";
        readonly ACTIVE: "#3B82F6";
        readonly ON_HOLD: "#F59E0B";
        readonly COMPLETED: "#10B981";
        readonly CANCELLED: "#EF4444";
        readonly TODO: "#6B7280";
        readonly IN_PROGRESS: "#3B82F6";
        readonly WAITING: "#F59E0B";
    };
};
export declare const REGEX_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly STRONG_PASSWORD: RegExp;
    readonly USERNAME: RegExp;
    readonly TAG: RegExp;
};
//# sourceMappingURL=index.d.ts.map