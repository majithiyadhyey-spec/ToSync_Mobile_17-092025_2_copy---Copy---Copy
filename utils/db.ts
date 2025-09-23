import { Project, Task, User, AuditLog, AppIntegrations } from '../types';
import { PROJECTS, TASKS, USERS } from '../constants';

/**
 * Interface representing the entire structure of the application's data.
 */
interface AppData {
  projects: Project[];
  tasks: Task[];
  users: User[];
  auditLogs: AuditLog[];
  integrations: AppIntegrations;
}

/**
 * Returns the initial, clean state for the application. Data is not persisted
 * and will reset on page reload. This prepares the app for a real backend.
 * @returns The complete application data object.
 */
export const getInitialData = (): AppData => {
  // Define the default structure for integration settings.
  const defaultIntegrations: AppIntegrations = {
      teams: {
          webhookUrl: '',
          notifications: {
              taskCreated: true,
              taskInProgress: true,
              taskCompleted: true,
          }
      },
      timezone: 'Asia/Kolkata', // Default timezone
  };

  const initialData: AppData = {
    projects: PROJECTS,
    tasks: TASKS,
    users: USERS,
    auditLogs: [],
    integrations: defaultIntegrations,
  };

  return initialData;
};

/**
 * This function is now a no-op as localStorage persistence has been removed.
 * @param data - The AppData object to be saved.
 */
export const saveData = (data: AppData) => {
  // No-op
};
