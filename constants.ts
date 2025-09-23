/**
 * This file contains the initial seed data for the application.
 * This data is used to populate the application on first load or when
 * localStorage is empty, providing a functional demo environment.
 */

import { Project, Task, TaskDefinition, TaskStatus, User, UserRole } from './types';

/**
 * An array of all available user roles in the application.
 */
export const USER_ROLES: UserRole[] = [UserRole.Administrator, UserRole.Planner, UserRole.Worker];

/**
 * A mapping of TaskStatus enums to their corresponding Tailwind CSS background color classes for consistent UI styling.
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.Planned]: 'bg-blue-600',
  [TaskStatus.InProgress]: 'bg-orange-500',
  [TaskStatus.Completed]: 'bg-green-600',
};

/**
 * Initial users are now empty. They will be fetched from the backend.
 * The list is kept as a fallback for AuthContext in case of loading issues.
 */
export const USERS: User[] = [
    { id: 'admin-01', name: 'admin', role: UserRole.Administrator, password: '123' },
    { id: 'planner-01', name: 'planner', role: UserRole.Planner, password: '123' },
    { id: 'w1', name: 'Novák', role: UserRole.Worker, age: 25, skills: ['Mold Making', 'Mold Assembly', 'Mechanical'], experience: 2, efficiency: 1.1, password: '123' },
];

/**
 * A comprehensive list of predefined task definitions, categorized by type,
 * each with a complexity score, base production hours, and required skills.
 * This is treated as application configuration and will be fetched from a backend.
 */
export const TASK_DEFINITIONS: TaskDefinition[] = [
  // NEW mold production
  { id: 'nf1', name: 'NF 1 - mold - production complexity 1', complexity: 1, baseProductionHours: 8, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  { id: 'nf2', name: 'NF 2 - mold - production complexity 2', complexity: 2, baseProductionHours: 16, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  { id: 'nf3', name: 'NF 3 - mold - production complexity 3', complexity: 3, baseProductionHours: 24, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  { id: 'nf4', name: 'NF 4 - mold - production complexity 4', complexity: 4, baseProductionHours: 32, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  { id: 'nf5', name: 'NF 5 - mold - production complexity 5', complexity: 5, baseProductionHours: 40, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  { id: 'nf6', name: 'NF 6 - mold - production complexity 6', complexity: 6, baseProductionHours: 48, taskType: 'NEW mold production', requiredSkills: ['Mold Making', 'Production'] },
  
  // Adjustment of mold
  { id: 'af1', name: 'AF 1 - mold - adjustment - time requirement 1', complexity: 1, baseProductionHours: 4, taskType: 'Adjustment of mold', requiredSkills: ['Mold Adjustment', 'Maintenance'] },
  { id: 'af2', name: 'AF 2 - mold - adjustment - time requirement 2', complexity: 2, baseProductionHours: 8, taskType: 'Adjustment of mold', requiredSkills: ['Mold Adjustment', 'Maintenance'] },
  { id: 'af3', name: 'AF 3 - mold - adjustment - time requirement 3', complexity: 3, baseProductionHours: 12, taskType: 'Adjustment of mold', requiredSkills: ['Mold Adjustment', 'Maintenance'] },
  { id: 'af4', name: 'AF 4 - mold - adjustment - time requirement 4', complexity: 4, baseProductionHours: 16, taskType: 'Adjustment of mold', requiredSkills: ['Mold Adjustment', 'Maintenance'] },
  { id: 'af5', name: 'AF 5 - mold - adjustment - time requirement 5', complexity: 5, baseProductionHours: 20, taskType: 'Adjustment of mold', requiredSkills: ['Mold Adjustment', 'Maintenance'] },

  // New mold for samples
  { id: 'nms1', name: 'NMS - new mold for samples', complexity: 3, baseProductionHours: 16, taskType: 'New mold for samples', requiredSkills: ['Mold Making', 'Sampling'] },
  
  // Mold assembly
  { id: 'ma1', name: 'MA 1 - mold assembly', complexity: 1, baseProductionHours: 4, taskType: 'Mold assembly', requiredSkills: ['Mold Assembly', 'Mechanical'] },
  { id: 'ma2', name: 'MA 2 - mold assembly', complexity: 2, baseProductionHours: 8, taskType: 'Mold assembly', requiredSkills: ['Mold Assembly', 'Mechanical'] },
  { id: 'ma3', name: 'MA 3 - mold assembly', complexity: 3, baseProductionHours: 12, taskType: 'Mold assembly', requiredSkills: ['Mold Assembly', 'Mechanical'] },

  // Cooperation on other task
  { id: 'coot1', name: 'COOT - cooperation on other task', complexity: 2, baseProductionHours: 8, taskType: 'Cooperation on other task', requiredSkills: [] },
  
  // Other task
  { id: 'ot1', name: 'OT - other task', complexity: 1, baseProductionHours: 4, taskType: 'Other task', requiredSkills: [] },
];

/**
 * Initial projects are now empty. They will be fetched from the backend.
 */
export const PROJECTS: Project[] = [];

/**
 * Initial tasks are now empty. They will be fetched from the backend.
 */
export const TASKS: Task[] = [];