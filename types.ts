/**
 * Represents a predefined template for a task, including its complexity and required skills.
 * This will eventually be replaced by data from MoldType and TaskType tables.
 */
export interface TaskDefinition {
  id: string;
  name: string;
  complexity: number;
  baseProductionHours: number;
  taskType: string;
  requiredSkills: string[];
}

/**
 * Defines the roles available to users within the application.
 * Matches the 'role_enum' type in the database.
 */
export enum UserRole {
  Administrator = 'Administrator',
  Planner = 'Planner',
  Worker = 'Worker',
}

/**
 * Defines the possible states a task can be in.
 * Matches the 'task_status_enum' type in the database.
 */
export enum TaskStatus {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

/**
 * Defines the possible states of a task's timer.
 * Matches the 'timer_state_enum' type in the database.
 */
export enum TimerState {
  Stopped = 'stopped',
  Running = 'running',
  Paused = 'paused',
}

/**
 * Represents a user of the application, mapping to the "User" table.
 */
export interface User {
  id: string; // Corresponds to user_id (UUID)
  name: string;
  email?: string;
  password?: string; // Storing plain-text passwords is a major security risk.
  role: UserRole;
  age?: number;
  skills?: any; // jsonb
  experience?: number;
  efficiency?: number; // Corresponds to efficiency_coeff
  dailyAvailability?: any; // jsonb
  isTwoFactorEnabled?: boolean; // Corresponds to two_factor
  twoFactorSecret?: string; // Corresponds to two_factor_secret
  createdAt?: string; // timestamptz
  updatedAt?: string; // timestamptz
  deletedAt?: string | null; // deleted_at
  archivedAt?: string | null; // archived_at
}


/**
 * Represents a single task within a project, mapping to the "Task" table.
 */
export interface Task {
  id: string; // task_id
  name: string;
  projectId: string; // project_id
  taskTypeId?: string; // task_type
  moldTypeId?: string; // mold_type
  startDate: string; // start_date (date)
  deadline: string; // end_date (date) -> Mapped from end_date in DB
  status: TaskStatus;
  timerState?: TimerState; // Corresponds to timer_state_enum
  createdAt?: string; // created_at
  updatedAt?: string; // updated_at
  deletedAt?: string | null; // deleted_at
  archivedAt?: string | null; // archived_at
  numberOfMolds?: number; // Corresponds to number_molds
  
  // Frontend-specific fields populated by API layer
  assignedWorkerIds: string[];
  notes?: string; // Will eventually be handled by TaskNote join table
  dailyTimeSpent: Record<string, Record<string, { time: number; notes?: string }>>; // Populated from TaskDailyTime
  activeTimers?: Record<string, { startTime: number }>; // { [workerId]: { startTime: number } }
}


/**
 * Represents a project containing multiple tasks, mapping to the "Project" table.
 */
export interface Project {
  id: string; // project_id
  name: string;
  marking: string;
  clientId: string; // client_id
  markingColor: string; // Mapped from color_red, color_green, color_blue
  startDate: string; // start_date
  endDate: string; // end_date
  createdAt?: string; // created_at
  updatedAt?: string; // updated_at
  deletedAt?: string | null; // deleted_at
  archivedAt?: string | null; // archived_at

  // Frontend-specific for now
  client: string; 
}


/**
 * Defines the types of actions that can be recorded in the audit log.
 */
export type AuditLogAction = 
  | 'login' | 'logout'
  | 'create_project' | 'update_project' | 'delete_project'
  | 'create_task' | 'update_task' | 'delete_task'
  | 'create_user' | 'update_user' | 'delete_user'
  | 'timer_start' | 'timer_pause' | 'timer_complete'
  | 'data_export' | 'data_import'
  | 'restore_project' | 'restore_task' | 'restore_user'
  | 'permanent_delete_project' | 'permanent_delete_task' | 'permanent_delete_user';

/**
 * Represents a single entry in the audit log, tracking a specific action.
 * Maps to the "AuditLogs" table.
 */
export interface AuditLog {
  id: string; // au_id
  timestamp: string; // timestamp
  actorId: string; // user_id
  action: AuditLogAction; // Mapped to 'event' and 'content'
  targetType: 'Project' | 'Task' | 'User' | 'System'; // Mapped to subject_type
  targetId?: string; // Mapped to subject_id
  archivedAt?: string | null; // archived_at

  // Frontend-specific
  actorName: string;
  targetName?: string;
}

/**
 * Represents the settings for Microsoft Teams integration.
 */
export interface TeamsIntegrationSettings {
  webhookUrl: string;
  notifications: {
    taskCreated: boolean;
    taskInProgress: boolean;
    taskCompleted: boolean;
  };
}

/**
 * Represents all third-party integration settings for the application.
 */
export interface AppIntegrations {
    teams: TeamsIntegrationSettings;
    timezone: string; // e.g., 'UTC', 'local', or an IANA timezone string like 'Asia/Kolkata'
}