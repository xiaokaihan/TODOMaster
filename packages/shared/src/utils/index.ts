import { format, isValid, parseISO } from 'date-fns';
import { Priority, TaskStatus, ObjectiveStatus } from '../types';

// 日期格式化工具
export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : '';
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return '今天';
  if (diffInDays === 1) return '昨天';
  if (diffInDays === -1) return '明天';
  if (diffInDays > 0) return `${diffInDays}天前`;
  return `${Math.abs(diffInDays)}天后`;
};

// 优先级相关工具
export const getPriorityLabel = (priority: Priority): string => {
  const labels = {
    [Priority.LOW]: '低',
    [Priority.MEDIUM]: '中',
    [Priority.HIGH]: '高',
    [Priority.CRITICAL]: '紧急',
  };
  return labels[priority];
};

export const getPriorityColor = (priority: Priority): string => {
  const colors = {
    [Priority.LOW]: '#10B981',
    [Priority.MEDIUM]: '#F59E0B',
    [Priority.HIGH]: '#F97316',
    [Priority.CRITICAL]: '#EF4444',
  };
  return colors[priority];
};

// 状态相关工具
export const getTaskStatusLabel = (status: TaskStatus): string => {
  const labels = {
    [TaskStatus.TODO]: '待办',
    [TaskStatus.IN_PROGRESS]: '进行中',
    [TaskStatus.WAITING]: '等待中',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.CANCELLED]: '已取消',
  };
  return labels[status];
};

export const getObjectiveStatusLabel = (status: ObjectiveStatus): string => {
  const labels = {
    [ObjectiveStatus.DRAFT]: '草稿',
    [ObjectiveStatus.ACTIVE]: '进行中',
    [ObjectiveStatus.ON_HOLD]: '暂停',
    [ObjectiveStatus.COMPLETED]: '已完成',
    [ObjectiveStatus.CANCELLED]: '已取消',
  };
  return labels[status];
};

/**
 * 格式化时长（分钟转换为可读格式）
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  let result = `${days} 天`
  if (remainingHours > 0) {
    result += ` ${remainingHours} 小时`
  }
  if (remainingMinutes > 0) {
    result += ` ${remainingMinutes} 分钟`
  }
  
  return result
}

export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// 字符串工具
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 验证工具
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  // 至少8位，包含大小写字母、数字和特殊字符
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// 数组工具
export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const key = getKey(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  getKey: (item: T) => string | number | Date,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aKey = getKey(a);
    const bKey = getKey(b);
    
    if (aKey < bKey) return order === 'asc' ? -1 : 1;
    if (aKey > bKey) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// 本地存储工具
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 静默失败
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 静默失败
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch {
      // 静默失败
    }
  },
}; 