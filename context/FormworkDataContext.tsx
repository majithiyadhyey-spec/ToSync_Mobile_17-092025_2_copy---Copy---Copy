import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Project, Task, User, TaskStatus, UserRole, AuditLog, AppIntegrations, TeamsIntegrationSettings, TimerState } from '../types';
import * as api from '../api';
import { supabase } from '../utils/supabaseClient';

/**
 * Represents the entire application's data structure.
 */
interface AppData {
  projects: Project[];
  tasks: Task[];
  users: User[];
  auditLogs: AuditLog[];
  integrations: AppIntegrations;
}

/**
 * Defines the shape of the context provided to the application.
 * This includes all data arrays, filtered memoized data for the UI,
 * and all functions to mutate the application state.
 */
interface FormworkDataContextType {
  // --- Raw Data State (including soft-deleted items) ---
  projects: Project[];
  tasks: Task[];
  users: User[];
  auditLogs: AuditLog[];
  integrations: AppIntegrations;
  
  // --- Memoized Active Data for UI ---
  activeProjects: Project[];
  activeTasks: Task[];
  activeUsers: User[];
  workers: User[];
  
  // --- Memoized Deleted Data for Recycle Bin ---
  deletedProjects: Project[];
  deletedTasks: Task[];
  deletedUsers: User[];

  // --- Status Indicators ---
  loading: boolean;
  error: string | null;
  
  // --- State Mutation Functions ---
  refreshData: () => Promise<void>;
  updateTask: (updatedTask: Task) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id'>) => Promise<Project>;
  addWorker: (workerData: Omit<User, 'id'> & { password: string }) => Promise<User>;
  addTask: (taskData: Omit<Task, 'id' | 'status' | 'dailyTimeSpent'> & { actorId: string }) => Promise<Task>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteWorker: (workerId: string) => Promise<void>;
  getTasksByProjectId: (projectId: string) => Task[];
  getTasksByWorkerId: (workerId: string) => Task[];
  updateUser: (updatedUser: User) => Promise<void>;
  updateProject: (updatedProject: Project) => Promise<void>;
  startTimer: (taskId: string, workerId: string) => Promise<void>;
  pauseTimer: (taskId: string, workerId: string) => Promise<void>;
  endTimer: (taskId: string) => Promise<void>;
  endDayAndAddNotes: (taskId: string, workerId: string, notes: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  restoreUser: (userId: string) => Promise<void>;
  permanentlyDeleteProject: (projectId: string) => Promise<void>;
  permanentlyDeleteTask: (taskId: string) => Promise<void>;
  permanentlyDeleteUser: (userId: string) => Promise<void>;
  addAuditLog: (logData: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  updateTeamsSettings: (settings: TeamsIntegrationSettings) => Promise<void>;
  updateTimezone: (timezone: string) => Promise<void>;
  restoreBackup: (data: AppData) => Promise<void>;
}

const FormworkDataContext = createContext<FormworkDataContextType | undefined>(undefined);

const defaultIntegrations: AppIntegrations = {
  teams: { webhookUrl: '', notifications: { taskCreated: true, taskInProgress: true, taskCompleted: true } },
  timezone: 'Asia/Kolkata',
};

export const FormworkDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [integrations, setIntegrations] = useState<AppIntegrations>(defaultIntegrations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {
        return; // Prevent concurrent fetches
    }
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
        const data = await api.fetchAppData();
        setProjects(data.projects || []);
        
        // Smartly update tasks to prevent interrupting an active timer or a recently completed task.
        setTasks(prevTasks => {
          const newTasks = data.tasks || [];
          const clientStateTasks = new Map<string, Task>();

          // Preserve the state of any tasks with an active timer or that were just completed.
          prevTasks.forEach(t => {
            if (t.timerState === TimerState.Running || t.timerState === TimerState.Paused || t.status === TaskStatus.Completed) {
              clientStateTasks.set(t.id, t);
            }
          });

          if (clientStateTasks.size > 0) {
            const newTasksMap = new Map(newTasks.map(t => [t.id, t]));
            // Ensure the important client-side states are preserved.
            clientStateTasks.forEach((clientTask, taskId) => {
                newTasksMap.set(taskId, clientTask);
            });
            return Array.from(newTasksMap.values());
          } else {
            return newTasks;
          }
        });

        setUsers(data.users || []);
        setAuditLogs(data.auditLogs || []);
        setIntegrations(data.integrations || defaultIntegrations);
    } catch (err: any) {
        setError(err.message || 'Failed to load application data from the server.');
        console.error(err);
    } finally {
        setLoading(false);
        isLoadingRef.current = false;
    }
  }, []);

  // Initial data load and real-time updates.
  useEffect(() => {
    loadData(); // Initial load

    const channel = supabase
      .channel('public-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Database change received, refreshing data:', payload);
          loadData();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Realtime!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase Realtime channel error:', err);
          setError(prev => prev ? `${prev}\nRealtime connection failed.` : `Realtime connection failed: ${err?.message}`);
        }
        if (status === 'TIMED_OUT') {
            console.warn('Supabase Realtime connection timed out. Automatic refresh may be paused.');
        }
      });

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  const refreshData = useCallback(async () => {
      await loadData();
  }, [loadData]);


  // --- Filtered Data Memos for UI ---
  const activeProjects = useMemo(() => projects.filter(p => !p.deletedAt), [projects]);
  const activeTasks = useMemo(() => {
    const activeProjectIds = new Set(activeProjects.map(p => p.id));
    return tasks.filter(t => !t.deletedAt && activeProjectIds.has(t.projectId));
  }, [activeProjects, tasks]);
  const activeUsers = useMemo(() => users.filter(u => !u.deletedAt), [users]);
  const workers = useMemo(() => activeUsers.filter(u => u.role === UserRole.Worker).sort((a, b) => a.name.localeCompare(b.name)), [activeUsers]);

  const deletedProjects = useMemo(() => projects.filter(p => !!p.deletedAt), [projects]);
  const deletedTasks = useMemo(() => tasks.filter(t => !!t.deletedAt), [tasks]);
  const deletedUsers = useMemo(() => users.filter(u => !!u.deletedAt), [users]);

    // --- CRUD Operations ---
  const updateTask = useCallback(async (updatedTask: Task) => {
    setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)));
    await api.updateTask(updatedTask);
  }, []);
  
  const addProject = useCallback(async (projectData: Omit<Project, 'id'>): Promise<Project> => {
     const newProject = await api.addProject(projectData);
     setProjects(prev => [...prev, newProject]);
     return newProject;
  }, []);

  const addWorker = useCallback(async (workerData: Omit<User, 'id'> & { password: string }): Promise<User> => {
    const newWorker = await api.addUser(workerData);
    setUsers(prev => [...prev, newWorker]);
    return newWorker;
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'status' | 'dailyTimeSpent'> & { actorId: string }): Promise<Task> => {
    const newTask = await api.addTask(taskData);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    setUsers(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
    await api.updateUser(updatedUser);
  }, []);

  const updateProject = useCallback(async (updatedProject: Project) => {
    setProjects(prev => prev.map(project => (project.id === updatedProject.id ? updatedProject : project)));
    await api.updateProject(updatedProject);
  }, []);

  // --- Deletes ---
  const deleteProject = useCallback(async (projectId: string) => {
    await api.deleteProject(projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p));
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await api.deleteTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t));
  }, []);

  const deleteWorker = useCallback(async (workerId: string) => {
    await api.deleteUser(workerId);
    setUsers(prev => prev.map(u => u.id === workerId ? { ...u, deletedAt: new Date().toISOString() } : u));
  }, []);
  
  // --- Recycle Bin ---
  const restoreProject = useCallback(async (projectId: string) => {
    await api.restoreItem('project', projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, deletedAt: null } : p));
  }, []);
  
  const restoreTask = useCallback(async (taskId: string) => {
    await api.restoreItem('task', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, deletedAt: null } : t));
  }, []);

  const restoreUser = useCallback(async (userId: string) => {
    await api.restoreItem('user', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: null } : u));
  }, []);

  const permanentlyDeleteProject = useCallback(async (projectId: string) => {
    await api.permanentlyDeleteItem('project', projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  }, []);

  const permanentlyDeleteTask = useCallback(async (taskId: string) => {
    await api.permanentlyDeleteItem('task', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const permanentlyDeleteUser = useCallback(async (userId: string) => {
    await api.permanentlyDeleteItem('user', userId);
     // Clean up tasks on the client-side for immediate UI consistency
    setTasks(prevTasks =>
      prevTasks.map(task => {
        const isAssigned = task.assignedWorkerIds.includes(userId);
        if (!isAssigned) return task;

        const updatedTask = { ...task };
        updatedTask.assignedWorkerIds = task.assignedWorkerIds.filter(id => id !== userId);
        
        // Also remove from active timers if present
        if (updatedTask.activeTimers && updatedTask.activeTimers[userId]) {
          delete updatedTask.activeTimers[userId];
          if (Object.keys(updatedTask.activeTimers).length === 0) {
              updatedTask.timerState = TimerState.Paused;
          }
        }
        return updatedTask;
      })
    );
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const addAuditLog = useCallback(async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog = await api.addAuditLog(logData);
    setAuditLogs(prevLogs => [newLog, ...prevLogs.slice(0, 499)]);
  }, []);

  const restoreBackup = useCallback(async (data: AppData) => {
    await api.restoreBackup(data);
    // The app will log out and reload, but setting state is good practice.
    setProjects(data.projects);
    setTasks(data.tasks);
    setUsers(data.users);
    setAuditLogs(data.auditLogs || []);
    setIntegrations(data.integrations || defaultIntegrations);
  }, []);

    // --- Timer Logic (Concurrent) ---
  const startTimer = useCallback(async (taskId: string, workerId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const newActiveTimers = { ...(taskToUpdate.activeTimers || {}), [workerId]: { startTime: Date.now() } };
    
    const updatedTask: Task = {
        ...taskToUpdate,
        timerState: TimerState.Running,
        status: TaskStatus.InProgress,
        activeTimers: newActiveTimers,
    };

    await updateTask(updatedTask);
  }, [tasks, updateTask]);

  const pauseTimer = useCallback(async (taskId: string, workerId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || !taskToUpdate.activeTimers?.[workerId]) return;

    const startTime = taskToUpdate.activeTimers[workerId].startTime;
    const timeElapsed = (Date.now() - startTime) / 1000;
    const today = new Date().toISOString().split('T')[0];
    
    const newDailyTimeSpent = JSON.parse(JSON.stringify(taskToUpdate.dailyTimeSpent || {}));
    if (!newDailyTimeSpent[workerId]) newDailyTimeSpent[workerId] = {};
    if (!newDailyTimeSpent[workerId][today]) newDailyTimeSpent[workerId][today] = { time: 0 };
    newDailyTimeSpent[workerId][today].time = (newDailyTimeSpent[workerId][today].time || 0) + timeElapsed;

    const newActiveTimers = { ...taskToUpdate.activeTimers };
    delete newActiveTimers[workerId];

    const updatedTask: Task = {
        ...taskToUpdate,
        timerState: Object.keys(newActiveTimers).length > 0 ? TimerState.Running : TimerState.Paused,
        dailyTimeSpent: newDailyTimeSpent,
        activeTimers: newActiveTimers
    };
    
    await updateTask(updatedTask);
  }, [tasks, updateTask]);
  
  const endDayAndAddNotes = useCallback(async (taskId: string, workerId: string, notes: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || !taskToUpdate.activeTimers?.[workerId]) return;
    
    const startTime = taskToUpdate.activeTimers[workerId].startTime;
    const timeElapsed = (Date.now() - startTime) / 1000;
    const today = new Date().toISOString().split('T')[0];
    
    const finalDailyTimeSpent = JSON.parse(JSON.stringify(taskToUpdate.dailyTimeSpent || {}));
    if (!finalDailyTimeSpent[workerId]) finalDailyTimeSpent[workerId] = {};
    if (!finalDailyTimeSpent[workerId][today]) finalDailyTimeSpent[workerId][today] = { time: 0 };
    finalDailyTimeSpent[workerId][today].time = (finalDailyTimeSpent[workerId][today].time || 0) + timeElapsed;
    if(notes && notes.trim()) {
        finalDailyTimeSpent[workerId][today].notes = notes;
    }
    
    const newActiveTimers = { ...taskToUpdate.activeTimers };
    delete newActiveTimers[workerId];

    const updatedTask: Task = {
        ...taskToUpdate,
        timerState: Object.keys(newActiveTimers).length > 0 ? TimerState.Running : TimerState.Paused, 
        dailyTimeSpent: finalDailyTimeSpent,
        activeTimers: newActiveTimers,
    };
    
    await updateTask(updatedTask);
  }, [tasks, updateTask]);

  const endTimer = useCallback(async (taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    let finalDailyTimeSpent = JSON.parse(JSON.stringify(taskToUpdate.dailyTimeSpent || {}));
    if (taskToUpdate.activeTimers && Object.keys(taskToUpdate.activeTimers).length > 0) {
        const today = new Date().toISOString().split('T')[0];
        for (const workerId in taskToUpdate.activeTimers) {
            const startTime = taskToUpdate.activeTimers[workerId].startTime;
            const timeElapsed = (Date.now() - startTime) / 1000;
            if (!finalDailyTimeSpent[workerId]) finalDailyTimeSpent[workerId] = {};
            if (!finalDailyTimeSpent[workerId][today]) finalDailyTimeSpent[workerId][today] = { time: 0 };
            finalDailyTimeSpent[workerId][today].time = (finalDailyTimeSpent[workerId][today].time || 0) + timeElapsed;
        }
    }

    const updatedTask: Task = {
        ...taskToUpdate,
        status: TaskStatus.Completed,
        timerState: TimerState.Stopped,
        activeTimers: {},
        dailyTimeSpent: finalDailyTimeSpent
    };

    await updateTask(updatedTask);
  }, [tasks, updateTask]);
  
  const updateTeamsSettings = useCallback(async (settings: TeamsIntegrationSettings) => {
      await api.updateTeamsSettings(settings);
      setIntegrations(prev => ({ ...prev, teams: settings }));
  }, []);

  const updateTimezone = useCallback(async (timezone: string) => {
      await api.updateTimezone(timezone);
      setIntegrations(prev => ({ ...prev, timezone }));
  }, []);

  const getTasksByProjectId = useCallback((projectId: string) => {
      return activeTasks.filter(task => task.projectId === projectId);
  }, [activeTasks]);

  const getTasksByWorkerId = useCallback((workerId: string) => {
      return activeTasks.filter(task => task.assignedWorkerIds.includes(workerId));
  }, [activeTasks]);
  
  const value = useMemo(() => ({
    projects, tasks, users, auditLogs, integrations,
    activeProjects, activeTasks, activeUsers, workers,
    deletedProjects, deletedTasks, deletedUsers,
    loading, error, updateTask, getTasksByProjectId, getTasksByWorkerId,
    addProject, addWorker, addTask, deleteProject, deleteTask, deleteWorker,
    updateUser, updateProject, startTimer, pauseTimer, endTimer, endDayAndAddNotes,
    restoreProject, restoreTask, restoreUser,
    permanentlyDeleteProject, permanentlyDeleteTask, permanentlyDeleteUser,
    addAuditLog, updateTeamsSettings, updateTimezone, refreshData,
    restoreBackup
  }), [
    projects, tasks, users, auditLogs, integrations,
    activeProjects, activeTasks, activeUsers, workers,
    deletedProjects, deletedTasks, deletedUsers,
    loading, error, updateTask, getTasksByProjectId, getTasksByWorkerId,
    addProject, addWorker, addTask, deleteProject, deleteTask, deleteWorker,
    updateUser, updateProject, startTimer, pauseTimer, endTimer, endDayAndAddNotes,
    restoreProject, restoreTask, restoreUser,
    permanentlyDeleteProject, permanentlyDeleteTask, permanentlyDeleteUser,
    addAuditLog, updateTeamsSettings, updateTimezone, refreshData,
    restoreBackup
  ]);

  return (
    <FormworkDataContext.Provider value={value}>
      {children}
    </FormworkDataContext.Provider>
  );
};

export const useFormworkData = (): FormworkDataContextType => {
  const context = useContext(FormworkDataContext);
  if (context === undefined) {
    throw new Error('useFormworkData must be used within a FormworkDataProvider');
  }
  return context;
};