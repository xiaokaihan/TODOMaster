import { Priority, TaskStatus, ObjectiveStatus } from '../types';
export declare const formatDate: (date: Date | string, formatStr?: string) => string;
/**
 * 格式化日期时间
 */
export declare const formatDateTime: (date: Date | string) => string;
export declare const formatRelativeDate: (date: Date | string) => string;
export declare const getPriorityLabel: (priority: Priority) => string;
export declare const getPriorityColor: (priority: Priority) => string;
export declare const getTaskStatusLabel: (status: TaskStatus) => string;
export declare const getObjectiveStatusLabel: (status: ObjectiveStatus) => string;
/**
 * 格式化时长（分钟转换为可读格式）
 */
export declare const formatDuration: (minutes: number) => string;
export declare const calculateProgress: (completed: number, total: number) => number;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const generateId: () => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isStrongPassword: (password: string) => boolean;
export declare const groupBy: <T, K extends keyof any>(array: T[], getKey: (item: T) => K) => Record<K, T[]>;
export declare const sortBy: <T>(array: T[], getKey: (item: T) => string | number | Date, order?: "asc" | "desc") => T[];
export declare const storage: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T) => void;
    remove: (key: string) => void;
    clear: () => void;
};
//# sourceMappingURL=index.d.ts.map