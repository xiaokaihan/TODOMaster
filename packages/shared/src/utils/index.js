"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.sortBy = exports.groupBy = exports.isStrongPassword = exports.isValidEmail = exports.generateId = exports.truncateText = exports.calculateProgress = exports.formatDuration = exports.getObjectiveStatusLabel = exports.getTaskStatusLabel = exports.getPriorityColor = exports.getPriorityLabel = exports.formatRelativeDate = exports.formatDateTime = exports.formatDate = void 0;
const date_fns_1 = require("date-fns");
const types_1 = require("../types");
// 日期格式化工具
const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    return (0, date_fns_1.isValid)(dateObj) ? (0, date_fns_1.format)(dateObj, formatStr) : '';
};
exports.formatDate = formatDate;
/**
 * 格式化日期时间
 */
const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};
exports.formatDateTime = formatDateTime;
const formatRelativeDate = (date) => {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    if (!(0, date_fns_1.isValid)(dateObj))
        return '';
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0)
        return '今天';
    if (diffInDays === 1)
        return '昨天';
    if (diffInDays === -1)
        return '明天';
    if (diffInDays > 0)
        return `${diffInDays}天前`;
    return `${Math.abs(diffInDays)}天后`;
};
exports.formatRelativeDate = formatRelativeDate;
// 优先级相关工具
const getPriorityLabel = (priority) => {
    const labels = {
        [types_1.Priority.LOW]: '低',
        [types_1.Priority.MEDIUM]: '中',
        [types_1.Priority.HIGH]: '高',
        [types_1.Priority.CRITICAL]: '紧急',
    };
    return labels[priority];
};
exports.getPriorityLabel = getPriorityLabel;
const getPriorityColor = (priority) => {
    const colors = {
        [types_1.Priority.LOW]: '#10B981',
        [types_1.Priority.MEDIUM]: '#F59E0B',
        [types_1.Priority.HIGH]: '#F97316',
        [types_1.Priority.CRITICAL]: '#EF4444',
    };
    return colors[priority];
};
exports.getPriorityColor = getPriorityColor;
// 状态相关工具
const getTaskStatusLabel = (status) => {
    const labels = {
        [types_1.TaskStatus.TODO]: '待办',
        [types_1.TaskStatus.IN_PROGRESS]: '进行中',
        [types_1.TaskStatus.WAITING]: '等待中',
        [types_1.TaskStatus.COMPLETED]: '已完成',
        [types_1.TaskStatus.CANCELLED]: '已取消',
    };
    return labels[status];
};
exports.getTaskStatusLabel = getTaskStatusLabel;
const getObjectiveStatusLabel = (status) => {
    const labels = {
        [types_1.ObjectiveStatus.DRAFT]: '草稿',
        [types_1.ObjectiveStatus.ACTIVE]: '进行中',
        [types_1.ObjectiveStatus.ON_HOLD]: '暂停',
        [types_1.ObjectiveStatus.COMPLETED]: '已完成',
        [types_1.ObjectiveStatus.CANCELLED]: '已取消',
    };
    return labels[status];
};
exports.getObjectiveStatusLabel = getObjectiveStatusLabel;
/**
 * 格式化时长（分钟转换为可读格式）
 */
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
        return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    let result = `${days} 天`;
    if (remainingHours > 0) {
        result += ` ${remainingHours} 小时`;
    }
    if (remainingMinutes > 0) {
        result += ` ${remainingMinutes} 分钟`;
    }
    return result;
};
exports.formatDuration = formatDuration;
const calculateProgress = (completed, total) => {
    if (total === 0)
        return 0;
    return Math.round((completed / total) * 100);
};
exports.calculateProgress = calculateProgress;
// 字符串工具
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
};
exports.truncateText = truncateText;
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
// 验证工具
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isStrongPassword = (password) => {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};
exports.isStrongPassword = isStrongPassword;
// 数组工具
const groupBy = (array, getKey) => {
    return array.reduce((result, item) => {
        const key = getKey(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
        return result;
    }, {});
};
exports.groupBy = groupBy;
const sortBy = (array, getKey, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aKey = getKey(a);
        const bKey = getKey(b);
        if (aKey < bKey)
            return order === 'asc' ? -1 : 1;
        if (aKey > bKey)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
};
exports.sortBy = sortBy;
// 本地存储工具
exports.storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch {
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        }
        catch {
            // 静默失败
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        }
        catch {
            // 静默失败
        }
    },
    clear: () => {
        try {
            localStorage.clear();
        }
        catch {
            // 静默失败
        }
    },
};
//# sourceMappingURL=index.js.map