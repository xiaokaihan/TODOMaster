import { z } from 'zod';
import { ObjectiveCategory, Priority, ObjectiveStatus, TaskStatus } from '../types';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    username: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email: string;
    password: string;
    username: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const createObjectiveSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodNativeEnum<typeof ObjectiveCategory>;
    priority: z.ZodNativeEnum<typeof Priority>;
    startDate: z.ZodDate;
    targetDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    category: ObjectiveCategory;
    title: string;
    startDate: Date;
    priority: Priority;
    description?: string | undefined;
    targetDate?: Date | undefined;
}, {
    category: ObjectiveCategory;
    title: string;
    startDate: Date;
    priority: Priority;
    description?: string | undefined;
    targetDate?: Date | undefined;
}>, {
    category: ObjectiveCategory;
    title: string;
    startDate: Date;
    priority: Priority;
    description?: string | undefined;
    targetDate?: Date | undefined;
}, {
    category: ObjectiveCategory;
    title: string;
    startDate: Date;
    priority: Priority;
    description?: string | undefined;
    targetDate?: Date | undefined;
}>;
export declare const updateObjectiveSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodNativeEnum<typeof ObjectiveCategory>>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof Priority>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ObjectiveStatus>>;
    startDate: z.ZodOptional<z.ZodDate>;
    targetDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    category?: ObjectiveCategory | undefined;
    status?: ObjectiveStatus | undefined;
    title?: string | undefined;
    description?: string | undefined;
    startDate?: Date | undefined;
    priority?: Priority | undefined;
    targetDate?: Date | undefined;
}, {
    category?: ObjectiveCategory | undefined;
    status?: ObjectiveStatus | undefined;
    title?: string | undefined;
    description?: string | undefined;
    startDate?: Date | undefined;
    priority?: Priority | undefined;
    targetDate?: Date | undefined;
}>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodNativeEnum<typeof Priority>;
    dueDate: z.ZodOptional<z.ZodDate>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    objectiveId: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    objectiveId: string;
    priority: Priority;
    description?: string | undefined;
    dueDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    tags?: string[] | undefined;
}, {
    title: string;
    objectiveId: string;
    priority: Priority;
    description?: string | undefined;
    dueDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    tags?: string[] | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof Priority>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof TaskStatus>>;
    dueDate: z.ZodOptional<z.ZodDate>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    actualDuration: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: TaskStatus | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: Priority | undefined;
    dueDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    tags?: string[] | undefined;
    actualDuration?: number | undefined;
    dependencies?: string[] | undefined;
}, {
    status?: TaskStatus | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: Priority | undefined;
    dueDate?: Date | undefined;
    estimatedDuration?: number | undefined;
    tags?: string[] | undefined;
    actualDuration?: number | undefined;
    dependencies?: string[] | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page: number;
    limit: number;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const objectiveQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof ObjectiveStatus>>;
    category: z.ZodOptional<z.ZodNativeEnum<typeof ObjectiveCategory>>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof Priority>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    page: z.ZodNumber;
    limit: z.ZodNumber;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    search?: string | undefined;
    category?: ObjectiveCategory | undefined;
    status?: ObjectiveStatus | undefined;
    priority?: Priority | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page: number;
    limit: number;
    search?: string | undefined;
    category?: ObjectiveCategory | undefined;
    status?: ObjectiveStatus | undefined;
    priority?: Priority | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const taskQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof TaskStatus>>;
    priority: z.ZodOptional<z.ZodNativeEnum<typeof Priority>>;
    objectiveId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    page: z.ZodNumber;
    limit: z.ZodNumber;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    search?: string | undefined;
    status?: TaskStatus | undefined;
    objectiveId?: string | undefined;
    priority?: Priority | undefined;
    tags?: string[] | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page: number;
    limit: number;
    search?: string | undefined;
    status?: TaskStatus | undefined;
    objectiveId?: string | undefined;
    priority?: Priority | undefined;
    tags?: string[] | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ObjectiveQueryInput = z.infer<typeof objectiveQuerySchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
//# sourceMappingURL=index.d.ts.map