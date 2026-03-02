import {
  Org,
  User,
  Strategy,
  Tactic,
  KPI,
  KPIValue,
  Folder,
  List,
  Task as PrismaTask,
  TaskKPI,
  TaskAssignee,
  TaskUpdate,
  Comment,
  Attachment,
  ActivityLog,
  TaskStatus,
  TaskPriority,
  ContributionType,
  KPIFrequency,
  UserRole,
} from '@prisma/client'

// Re-export Prisma types and enums
export type {
  Org,
  User,
  Strategy,
  Tactic,
  KPI,
  KPIValue,
  Folder,
  List,
  TaskKPI,
  TaskAssignee,
  TaskUpdate,
  Comment,
  Attachment,
  ActivityLog,
}
export { TaskStatus, TaskPriority, ContributionType, KPIFrequency, UserRole }

// Task type for list views (with nested relations)
export interface Task {
  id: number
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  progress: number
  startDate?: Date | string | null
  dueDate?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  orgId?: number | null
  org?: { id: number; name: string; zone?: string | null } | null
  strategy?: { id: number; code: string; name: string }
  tactic?: { id: number; code: string; name: string }
  list?: { id: number; name: string } | null
  createdBy?: { id: number; fullName: string; email: string }
  taskKpis?: Array<{ 
    kpi: { id: number; code: string; name: string; unit: string }
    contributionType: ContributionType
    expectedContributionNote?: string | null 
  }>
  assignees?: Array<{ user: { id: number; fullName: string; email: string } }>
  _count?: { comments: number; attachments: number; updates: number }
}

// Task detail type (for drawer/detail view)
export interface TaskDetail extends Task {
  updates?: Array<{
    id: number
    content: string
    previousProgress?: number | null
    newProgress?: number | null
    createdAt: Date | string
    user: { id: number; fullName: string }
  }>
  comments?: Array<{
    id: number
    content: string
    createdAt: Date | string
    user: { id: number; fullName: string }
  }>
  attachments?: Array<{
    id: number
    filename: string
    filepath: string
    createdAt: Date | string
    user: { id: number; fullName: string }
  }>
}

// Auth user type - re-export from auth
export type { AuthUser } from '@/lib/auth'

// Extended types with relations
export type StrategyWithTactics = Strategy & {
  tactics: TacticWithKPIs[]
}

export type TacticWithKPIs = Tactic & {
  kpis: KPI[]
  strategy?: Strategy
}

export type KPIWithTactic = KPI & {
  tactic: Tactic & {
    strategy: Strategy
  }
}

// API Request/Response types
export interface CreateTaskInput {
  listId?: number
  strategyId: number
  tacticId: number
  title: string
  description?: string
  priority?: TaskPriority
  startDate?: string
  dueDate?: string
  assigneeIds?: number[]
  kpiLinks: {
    kpiId: number
    contributionType?: ContributionType
    expectedContributionNote?: string
  }[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  startDate?: string | null
  dueDate?: string | null
  progressPercent?: number
  listId?: number | null
}

export interface CreateTaskUpdateInput {
  status: TaskStatus
  progressPercent: number
  doneNote?: string
  issueNote?: string
  nextStep?: string
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: number
  kpiId?: number
  dueFilter?: 'overdue' | 'next7days' | 'next30days'
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Auth types
export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: number
    email: string
    fullName: string
    role: UserRole
    org?: {
      id: number
      name: string
    } | null
  }
  token: string
}
