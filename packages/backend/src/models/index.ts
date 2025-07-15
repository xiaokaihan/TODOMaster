// 实体导出 - 显式导出以避免冲突
export { User, UserRole, UserPreferences, UserStats, UserDetail } from './entities/User'
export { 
  Objective, 
  ObjectiveCategory, 
  ObjectiveStatus, 
  ObjectiveDetail,
  KeyResult as ObjectiveKeyResult,
  Task as ObjectiveTask
} from './entities/Objective'
export { 
  KeyResult, 
  KeyResultType, 
  KeyResultStatus, 
  KeyResultDetail,
  TaskInfo as KeyResultTaskInfo
} from './entities/KeyResult'
export { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskDependency, 
  TaskDetail,
  TaskDependencyInfo as TaskEntityDependencyInfo
} from './entities/Task'

// DTO 导出 - 显式导出以避免冲突
export {
  CreateObjectiveDto,
  UpdateObjectiveDto,
  ObjectiveListQuery,
  ObjectiveResponse,
  ObjectiveDetailResponse,
  KeyResultResponse as ObjectiveDtoKeyResultResponse,
  TaskResponse as ObjectiveDtoTaskResponse,
  PaginatedResponse
} from './dto/ObjectiveDto'
export {
  CreateTaskDto,
  UpdateTaskDto,
  TaskListQuery,
  UpdateTaskStatusDto,
  TaskDependencyDto,
  TaskResponse,
  TaskDetailResponse,
  TaskDependencyInfo
} from './dto/TaskDto'
export {
  CreateKeyResultDto,
  UpdateKeyResultDto,
  KeyResultListQuery,
  UpdateKeyResultProgressDto,
  KeyResultResponse,
  KeyResultDetailResponse,
  TaskInfo
} from './dto/KeyResultDto'

// 通用类型导出
export {
  ApiResponse,
  PaginationInfo,
  BaseQuery,
  Timestamps,
  SoftDelete,
  BaseEntity,
  UserOwnedEntity,
  ActionType,
  EntityType,
  ActivityLog
} from './types/Common'

// 命名空间导出以避免冲突
import * as UserTypes from './entities/User'
import * as ObjectiveTypes from './entities/Objective'
import * as KeyResultTypes from './entities/KeyResult'
import * as TaskTypes from './entities/Task'

export {
  UserTypes,
  ObjectiveTypes,
  KeyResultTypes,
  TaskTypes
} 