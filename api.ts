/**
 * This file serves as the API layer for the application.
 * It abstracts the data fetching and manipulation logic, making it seem
 * as though the app is communicating with a remote server. All operations
 * are performed on the Supabase backend.
 * This layer also acts as a transformer, mapping snake_case column names
 * from the database to camelCase properties for the frontend.
 */

import { Project, Task, User, AuditLog, AppIntegrations, TeamsIntegrationSettings, UserRole, TaskStatus, TimerState } from './types';
import { Customer, Quotation, Order, InventoryItem, Shipment } from './types/erpTypes';
import { supabase } from './utils/supabaseClient';

// --- Notification Helper ---

/**
 * Sends a request to the notification server to alert workers of a task assignment.
 * This is a "fire-and-forget" call that does not block the UI.
 * @param workerIds An array of worker IDs to notify.
 * @param task The task that was assigned.
 */
async function notifyTaskAssigned(workerIds: string[], task: Pick<Task, 'id' | 'name' | 'projectId'>) {
    if (!workerIds || workerIds.length === 0) return;

    const backendUrl = 'https://tosync-mobile-backend-m3nfh1a2w-majithiyadhyey-1000s-projects.vercel.app';
    try {
        const notificationPromise = fetch(`${backendUrl}/api/notify-task-assigned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assignedWorkerIds: workerIds,
                taskName: "New task assigned",
            }),
        });

        // Asynchronously handle the response without blocking the main thread.
        notificationPromise.then(async (response) => {
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Notification server responded with status ${response.status}: ${errorBody}`);
            }
        }).catch(networkError => console.error('Failed to send notification request:', networkError));

        console.log('Task assignment notification request sent for task:', task.name);
    } catch (error) {
        console.error('Failed to send task assignment notification request:', error);
    }
}

// export async function callVercelApi() {
//     const backendUrl = 'https://tosync-fxnausxrh-majithiyadhyey-1000s-projects.vercel.app';
//     try {
//         const response = await fetch(`${backendUrl}/api/notify-task-assigned`);
//         const data = await response.json();
//         console.log('Response from Vercel API:', data);
//     } catch (error) {
//         console.error('Failed to call Vercel API:', error);
//     }
// }


// --- Data Transformers ---

const projectFromDb = (dbProject: any): Project => ({
    id: dbProject.project_id,
    name: dbProject.name,
    marking: dbProject.marking,
    clientId: dbProject.client_id,
    markingColor: `#${dbProject.color_red.toString(16).padStart(2, '0')}${dbProject.color_green.toString(16).padStart(2, '0')}${dbProject.color_blue.toString(16).padStart(2, '0')}`,
    startDate: dbProject.start_date,
    endDate: dbProject.end_date,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
    deletedAt: dbProject.deleted_at,
    archivedAt: dbProject.archived_at,
    client: dbProject.customer?.customer_name || 'Unknown Client' // Handle joined customer name
});

const taskFromDb = (dbTask: any): Task => ({
    id: dbTask.task_id,
    name: dbTask.name,
    projectId: dbTask.project_id,
    taskTypeId: dbTask.task_type,
    moldTypeId: dbTask.mold_type,
    startDate: dbTask.start_date,
    deadline: dbTask.end_date,
    status: dbTask.status,
    timerState: dbTask.timer_state,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    deletedAt: dbTask.deleted_at,
    archivedAt: dbTask.archived_at,
    numberOfMolds: dbTask.number_molds,
    assignedWorkerIds: [], // To be populated later
    dailyTimeSpent: {}, // To be populated later
    activeTimers: dbTask.active_timers || {},
});

const userFromDb = (dbUser: any): User => ({
    id: dbUser.user_id,
    name: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
    age: dbUser.age,
    skills: dbUser.skills,
    experience: dbUser.experience,
    efficiency: dbUser.efficiency_coeff,
    dailyAvailability: dbUser.daily_availability,
    isTwoFactorEnabled: dbUser.two_factor,
    twoFactorSecret: dbUser.two_factor_secret,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    deletedAt: dbUser.deleted_at,
    archivedAt: dbUser.archived_at,
});

const auditLogFromDb = (dbLog: any): AuditLog => ({
    id: dbLog.au_id,
    timestamp: dbLog.timestamp,
    actorId: dbLog.user_id,
    action: dbLog.event,
    targetType: dbLog.subject_type,
    targetId: dbLog.subject_id,
    actorName: dbLog.users?.name || 'Unknown User',
    targetName: dbLog.content, // Target name is stored in the content field.
    archivedAt: dbLog.archived_at,
});


// --- Main App Data Endpoints ---

interface AppData {
  projects: Project[];
  tasks: Task[];
  users: User[];
  auditLogs: AuditLog[];
  integrations: AppIntegrations;
}


/**
 * Fetches all application data from the Supabase backend sequentially for better error reporting.
 */
export const fetchAppData = async (): Promise<AppData> => {
    // Fetch Projects
    const { data: projectsData, error: projectsError } = await supabase.from('project').select('*, customer(customer_name)');
    if (projectsError) throw new Error(`Failed to fetch Projects: ${projectsError.message}`);

    // Fetch Tasks
    const { data: tasksData, error: tasksError } = await supabase.from('task').select('*');
    if (tasksError) throw new Error(`Failed to fetch Tasks: ${tasksError.message}`);

    // Fetch Users
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw new Error(`Failed to fetch Users: ${usersError.message}`);
    
    // Fetch TaskWorker relationships
    const { data: taskWorkerData, error: taskWorkerError } = await supabase.from('taskworker').select('*');
    if (taskWorkerError) throw new Error(`Failed to fetch TaskWorker relations: ${taskWorkerError.message}`);
    
    // Fetch TaskDailyTime
    const { data: dailyTimeData, error: dailyTimeError } = await supabase.from('taskdailytime').select('*');
    if (dailyTimeError) throw new Error(`Failed to fetch TaskDailyTime: ${dailyTimeError.message}`);
    
    // Fetch Task Notes
    const { data: taskNoteData, error: taskNoteError } = await supabase.from('tasknote').select('*');
    if (taskNoteError) throw new Error(`Failed to fetch Task Notes: ${taskNoteError.message}`);

    // Fetch AuditLogs with user names joined
    const { data: auditLogsData, error: auditLogsError } = await supabase
        .from('auditlogs')
        .select('*, users(name)')
        .order('timestamp', { ascending: false })
        .limit(500);
    if (auditLogsError) throw new Error(`Failed to fetch Audit Logs: ${auditLogsError.message}`);

    // Fetch Timezone
    const { data: timezoneData, error: timezoneError } = await supabase.from('system_timezone').select('sys_tmz').limit(1).single();
    let timezone = 'Asia/Kolkata'; // Default
    if (timezoneError && timezoneError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine on first launch.
        console.error("Error fetching timezone, using default:", timezoneError);
    } else if (timezoneData) {
        timezone = timezoneData.sys_tmz;
    }


    const projects = projectsData.map(projectFromDb);
    const tasks = tasksData.map(taskFromDb);
    const users = usersData.map(userFromDb);
    const auditLogs = auditLogsData.map(auditLogFromDb);

    // Map TaskWorker relationships to tasks
    const taskWorkerMap = new Map<string, string[]>();
    taskWorkerData.forEach(tw => {
        if (!taskWorkerMap.has(tw.task_id)) {
            taskWorkerMap.set(tw.task_id, []);
        }
        taskWorkerMap.get(tw.task_id)!.push(tw.user_id);
    });

    tasks.forEach(task => {
        task.assignedWorkerIds = taskWorkerMap.get(task.id) || [];
    });

    // Map TaskDailyTime and TaskNote to tasks
    const dailyTimeMap = new Map<string, Task['dailyTimeSpent']>();

    // Process time entries
    dailyTimeData.forEach(entry => {
        if (!dailyTimeMap.has(entry.task_id)) dailyTimeMap.set(entry.task_id, {});
        const taskTimes = dailyTimeMap.get(entry.task_id)!;
        if (!taskTimes[entry.user_id]) taskTimes[entry.user_id] = {};
        if (!taskTimes[entry.user_id][entry.spent_date]) taskTimes[entry.user_id][entry.spent_date] = { time: 0 };
        taskTimes[entry.user_id][entry.spent_date].time += (entry.hours || 0) * 3600;
    });

    // Process note entries
    taskNoteData.forEach(entry => {
        if (!dailyTimeMap.has(entry.task_id)) dailyTimeMap.set(entry.task_id, {});
        const taskTimes = dailyTimeMap.get(entry.task_id)!;
        if (!taskTimes[entry.user_id]) taskTimes[entry.user_id] = {};
        if (!taskTimes[entry.user_id][entry.note_date]) taskTimes[entry.user_id][entry.note_date] = { time: 0 };
        taskTimes[entry.user_id][entry.note_date].notes = entry.note_text;
    });


    tasks.forEach(task => {
        task.dailyTimeSpent = dailyTimeMap.get(task.id) || {};
    });

    return { 
        projects, 
        tasks, 
        users, 
        auditLogs, 
        integrations: { teams: { webhookUrl: '', notifications: { taskCreated: true, taskInProgress: true, taskCompleted: true } }, timezone: timezone }
    };
};

/**
 * Fetches a single user profile by their name for the login process.
 * @param name The name of the user to fetch.
 * @returns A promise that resolves with the User object or null if not found.
 */
export const fetchUserByName = async (name: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .single();
    if (error) {
        // 'single()' throws an error if no rows are found, which is expected for a failed login.
        // We only log other types of errors.
        if (error.code !== 'PGRST116') {
             console.error('Error fetching user by name:', error);
        }
        return null;
    }
    return userFromDb(data);
};

/**
 * Insecurely updates a user's password based on their email address.
 * WARNING: This is a major security vulnerability as it does not verify user identity.
 * @param email The user's email.
 * @param newPassword The new password to set.
 */
export const updateUserPasswordByEmail = async (email: string, newPassword: string): Promise<void> => {
    // This is an insecure operation. It assumes that anyone who knows an email address
    // should be able to change the password for that account. This relies on RLS policies
    // being configured to allow public updates to the 'password' column, which is not recommended.
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('email', email);

    if (error) {
        console.error("Insecure password reset failed:", error);
        throw new Error("Failed to update password. Check RLS policies.");
    }

    // Fail silently in the UI even if the email doesn't exist to prevent email enumeration.
    return;
};


// --- Projects ---
export const addProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    const projectId = crypto.randomUUID();
    const hex = projectData.markingColor.startsWith('#') ? projectData.markingColor.slice(1) : projectData.markingColor;
    const color_red = parseInt(hex.substring(0, 2), 16);
    const color_green = parseInt(hex.substring(2, 4), 16);
    const color_blue = parseInt(hex.substring(4, 6), 16);
    
    const { data, error } = await supabase.from('project').insert({
        project_id: projectId,
        name: projectData.name,
        marking: projectData.marking,
        client_id: projectData.clientId,
        color_red, color_green, color_blue,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
    }).select('*, customer(customer_name)').single();

    if (error) throw error;
    return projectFromDb(data);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
    const hex = updatedProject.markingColor.startsWith('#') ? updatedProject.markingColor.slice(1) : updatedProject.markingColor;
    const color_red = parseInt(hex.substring(0, 2), 16);
    const color_green = parseInt(hex.substring(2, 4), 16);
    const color_blue = parseInt(hex.substring(4, 6), 16);

    const { data, error } = await supabase.from('project').update({
        name: updatedProject.name,
        marking: updatedProject.marking,
        client_id: updatedProject.clientId,
        start_date: updatedProject.startDate,
        end_date: updatedProject.endDate,
        color_red, color_green, color_blue,
    }).eq('project_id', updatedProject.id).select('*, customer(customer_name)').single();
    if (error) throw error;
    return projectFromDb(data);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const { error } = await supabase.from('project')
      .update({ deleted_at: new Date().toISOString() })
      .eq('project_id', projectId);
    if (error) throw error;
};

// --- Tasks ---
export const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'dailyTimeSpent'> & { actorId: string }): Promise<Task> => {
    const taskId = crypto.randomUUID();
    const { data, error } = await supabase.from('task').insert({
        task_id: taskId,
        name: taskData.name,
        project_id: taskData.projectId,
        start_date: taskData.startDate,
        end_date: taskData.deadline,
        status: TaskStatus.Planned,
        timer_state: TimerState.Stopped,
        number_molds: taskData.numberOfMolds,
    }).select().single();

    if (error) throw error;
    
    // Handle assigned workers
    if (taskData.assignedWorkerIds.length > 0) {
        const workerMappings = taskData.assignedWorkerIds.map(userId => ({
            task_id: taskId,
            user_id: userId
        }));
        const { error: workerError } = await supabase.from('taskworker').insert(workerMappings);
        if (workerError) throw workerError;
    }

    // Handle initial notes/description
    if (taskData.notes && taskData.notes.trim()) {
        const startDate = taskData.startDate.split('T')[0];
        const { error: noteError } = await supabase.from('tasknote').insert({
            note_id: crypto.randomUUID(),
            task_id: taskId,
            user_id: taskData.actorId, // The user creating the task
            note_date: startDate,
            note_text: taskData.notes.trim(),
        });
        if (noteError) throw noteError;
    }

    const newTask = taskFromDb(data);
    newTask.assignedWorkerIds = taskData.assignedWorkerIds;
    // Populate the returned task with the note for immediate UI consistency.
    if (taskData.notes && taskData.notes.trim()) {
        const startDate = taskData.startDate.split('T')[0];
        newTask.dailyTimeSpent = {
            [taskData.actorId]: {
                [startDate]: { time: 0, notes: taskData.notes.trim() }
            }
        };
    }

    // Send notification to assigned workers
    notifyTaskAssigned(taskData.assignedWorkerIds, newTask);
    return newTask;
};

export const updateTask = async (updatedTask: Task): Promise<Task> => {
    const { data, error } = await supabase.from('task').update({
        name: updatedTask.name,
        start_date: updatedTask.startDate,
        end_date: updatedTask.deadline,
        status: updatedTask.status,
        timer_state: updatedTask.timerState,
        active_timers: updatedTask.activeTimers || {},
        number_molds: updatedTask.numberOfMolds,
    }).eq('task_id', updatedTask.id).select().single();
    if (error) throw error;
    
    // Update assigned workers
    const { error: deleteWorkerError } = await supabase.from('taskworker').delete().eq('task_id', updatedTask.id);
    if (deleteWorkerError) throw deleteWorkerError;

    if (updatedTask.assignedWorkerIds.length > 0) {
        const workerMappings = updatedTask.assignedWorkerIds.map(userId => ({
            task_id: updatedTask.id,
            user_id: userId
        }));
        const { error: insertWorkerError } = await supabase.from('taskworker').insert(workerMappings);
        if (insertWorkerError) throw insertWorkerError;
    }
    
    // Update daily time spent and notes
    if (updatedTask.dailyTimeSpent) {
        const { error: deleteTimeError } = await supabase.from('taskdailytime').delete().eq('task_id', updatedTask.id);
        if (deleteTimeError) throw deleteTimeError;
        
        const { error: deleteNoteError } = await supabase.from('tasknote').delete().eq('task_id', updatedTask.id);
        if (deleteNoteError) throw deleteNoteError;
        
        const timeEntries: any[] = [];
        const noteEntries: any[] = [];
        for (const workerId in updatedTask.dailyTimeSpent) {
            for (const date in updatedTask.dailyTimeSpent[workerId]) {
                const record = updatedTask.dailyTimeSpent[workerId][date];
                if (record.time > 0) {
                    timeEntries.push({
                        time_spent_id: crypto.randomUUID(),
                        task_id: updatedTask.id,
                        user_id: workerId,
                        spent_date: date,
                        hours: record.time / 3600, // Convert seconds to hours
                    });
                }
                if (record.notes && record.notes.trim()) {
                    noteEntries.push({
                        note_id: crypto.randomUUID(),
                        task_id: updatedTask.id,
                        user_id: workerId,
                        note_date: date,
                        note_text: record.notes.trim(),
                    });
                }
            }
        }
        
        if (timeEntries.length > 0) {
            const { error: insertTimeError } = await supabase.from('taskdailytime').insert(timeEntries);
            if (insertTimeError) throw insertTimeError;
        }

        if (noteEntries.length > 0) {
            const { error: insertNoteError } = await supabase.from('tasknote').insert(noteEntries);
            if (insertNoteError) throw insertNoteError;
        }
    }

    const newTask = taskFromDb(data);
    newTask.assignedWorkerIds = updatedTask.assignedWorkerIds;
    newTask.dailyTimeSpent = updatedTask.dailyTimeSpent || {};

    // Send notification to assigned workers
    notifyTaskAssigned(updatedTask.assignedWorkerIds, newTask);
    return newTask;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('task')
      .update({ deleted_at: new Date().toISOString() })
      .eq('task_id', taskId);
    if (error) throw error;
};

// --- Users ---
export const addUser = async (userData: Omit<User, 'id'> & {password: string}): Promise<User> => {
    const userId = crypto.randomUUID();
    const profilePayload: any = {
        user_id: userId,
        name: userData.name,
        email: userData.email,
        password: userData.password, // Storing plaintext password
        role: userData.role,
    };

    if (userData.role === UserRole.Worker) {
        profilePayload.age = userData.age;
        profilePayload.skills = userData.skills;
        profilePayload.experience = userData.experience;
        profilePayload.efficiency_coeff = userData.efficiency;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(profilePayload)
      .select()
      .single();
    
    if (error) {
        console.error("Failed to add user profile:", error);
        throw error;
    }
    
    return userFromDb(data);
};


export const updateUser = async (updatedUser: User): Promise<User> => {
    const payload: Record<string, any> = {
        name: updatedUser.name,
        email: updatedUser.email,
        password: updatedUser.password,
        role: updatedUser.role,
        age: updatedUser.age,
        skills: updatedUser.skills,
        experience: updatedUser.experience,
        efficiency_coeff: updatedUser.efficiency,
        daily_availability: updatedUser.dailyAvailability,
        two_factor: updatedUser.isTwoFactorEnabled,
        two_factor_secret: updatedUser.twoFactorSecret,
    };

    const { data, error } = await supabase.from('users').update(payload).eq('user_id', updatedUser.id).select().single();
    if(error) throw error;
    
    const updatedProfile = userFromDb(data);
    return updatedProfile;
};

export const deleteUser = async (userId: string): Promise<void> => {
     const { error } = await supabase.from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
};

// --- Audit Logs ---
export const addAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> => {
    const logToInsert = {
        au_id: crypto.randomUUID(),
        user_id: logData.actorId,
        event: logData.action,
        content: logData.targetName || null,
        subject_type: logData.targetType,
        subject_id: logData.targetId || null,
    };

    const { data, error } = await supabase
        .from('auditlogs')
        .insert(logToInsert)
        .select()
        .single();

    if (error) {
        console.error("Failed to insert audit log:", error);
        throw error;
    }

    const newLog = auditLogFromDb(data);
    // The actorName is not returned from the insert, but we have it in the original `logData`.
    // We add it here so the object returned to the context is complete.
    newLog.actorName = logData.actorName;
    return newLog;
};

// --- ERP Functions ---

const customerFromDb = (dbCustomer: any): Customer => ({
    id: dbCustomer.customer_id,
    name: dbCustomer.customer_name,
    contactName: dbCustomer.contact_name,
    email: dbCustomer.email,
    tel: dbCustomer.tel,
    billingAddress: dbCustomer.bill_address,
    shippingAddress: dbCustomer.ship_address,
    tags: dbCustomer.tags || [],
    createdAt: dbCustomer.created_at,
    status: dbCustomer.status,
    projectNames: dbCustomer.project_names,
});

interface ErpData {
  customers: Customer[];
  quotations: Quotation[];
  orders: Order[];
  inventory: InventoryItem[];
  shipments: Shipment[];
}

export const fetchErpData = async (): Promise<ErpData> => {
    const { data, error } = await supabase.from('customer').select('*').is('archived_at', null).order('customer_name', { ascending: true });
    if (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }

    const customers = data.map(customerFromDb);
    
    // For now, other ERP data remains empty as per original mock.
    return { 
        customers, 
        quotations: [], 
        orders: [], 
        inventory: [], 
        shipments: [] 
    };
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const customerId = crypto.randomUUID();
    const { data, error } = await supabase.from('customer').insert({
        customer_id: customerId,
        customer_name: customerData.name,
        contact_name: customerData.contactName,
        email: customerData.email,
        tel: customerData.tel,
        bill_address: customerData.billingAddress,
        ship_address: customerData.shippingAddress,
        tags: customerData.tags
    }).select().single();

    if (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
    return customerFromDb(data);
};

export const updateCustomer = async (updatedCustomer: Customer): Promise<Customer> => {
    const { data, error } = await supabase.from('customer').update({
        customer_name: updatedCustomer.name,
        contact_name: updatedCustomer.contactName,
        email: updatedCustomer.email,
        tel: updatedCustomer.tel,
        bill_address: updatedCustomer.billingAddress,
        ship_address: updatedCustomer.shippingAddress,
        tags: updatedCustomer.tags
    }).eq('customer_id', updatedCustomer.id).select().single();

    if (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
    return customerFromDb(data);
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
    const { error } = await supabase.from('customer')
      .update({ archived_at: new Date().toISOString() })
      .eq('customer_id', customerId);
    if (error) {
        console.error("Error deleting customer:", error);
        throw error;
    }
};


// --- The following functions are placeholders and not connected to Supabase yet ---
export const updateTeamsSettings = (settings: TeamsIntegrationSettings): Promise<void> => {
    console.log("Updating Teams settings (mock):", settings);
    return Promise.resolve();
};

export const updateTimezone = async (timezone: string): Promise<void> => {
    // Delete all existing rows to ensure only one timezone setting exists.
    // The filter is a trick to delete all rows since delete() requires a filter.
    const { error: deleteError } = await supabase
        .from('system_timezone')
        .delete()
        .neq('sys_tmz', 'a_non_existent_dummy_value');
    
    if (deleteError) {
        console.error("Error clearing existing timezone:", deleteError);
        throw deleteError;
    }

    // Insert the new timezone setting.
    const { error: insertError } = await supabase
        .from('system_timezone')
        .insert({ sys_tmz: timezone });

    if (insertError) {
        console.error("Error setting new timezone:", insertError);
        throw insertError;
    }
};


export const restoreBackup = (data: AppData): Promise<void> => {
    console.log("Restoring backup (mock):", data);
    return Promise.resolve();
};

export const restoreItem = async (itemType: 'project' | 'task' | 'user', itemId: string): Promise<void> => {
    const table = itemType === 'project' ? 'project' : itemType === 'task' ? 'task' : 'users';
    const idColumn = itemType === 'project' ? 'project_id' : itemType === 'task' ? 'task_id' : 'user_id';
    
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq(idColumn, itemId);
    if (error) throw error;
};

export const permanentlyDeleteItem = async (itemType: 'project' | 'task' | 'user', itemId: string): Promise<void> => {
    if (itemType === 'project') {
        // --- Permanently Deleting a Project ---
        // 1. Find all tasks associated with the project.
        const { data: tasks, error: fetchTasksError } = await supabase
            .from('task')
            .select('task_id')
            .eq('project_id', itemId);

        if (fetchTasksError) throw fetchTasksError;

        if (tasks && tasks.length > 0) {
            const taskIds = tasks.map(t => t.task_id);

            // 2. Delete all dependencies for these tasks in bulk.
            await Promise.all([
                supabase.from('taskworker').delete().in('task_id', taskIds),
                supabase.from('taskdailytime').delete().in('task_id', taskIds),
                supabase.from('tasknote').delete().in('task_id', taskIds)
            ]).then(results => {
                for (const result of results) {
                    if (result.error) throw result.error;
                }
            });

            // 3. Now that dependencies are gone, delete the tasks themselves.
            const { error: taskError } = await supabase.from('task').delete().in('task_id', taskIds);
            if (taskError) throw taskError;
        }

        // 4. Finally, delete the project.
        const { error: projectError } = await supabase.from('project').delete().eq('project_id', itemId);
        if (projectError) throw projectError;

    } else if (itemType === 'task') {
        // --- Permanently Deleting a single Task ---
        // 1. Delete dependencies first.
        await Promise.all([
            supabase.from('taskworker').delete().eq('task_id', itemId),
            supabase.from('taskdailytime').delete().eq('task_id', itemId),
            supabase.from('tasknote').delete().eq('task_id', itemId)
        ]).then(results => {
            for (const result of results) {
                if (result.error) throw result.error;
            }
        });

        // 2. Delete the task.
        const { error: taskError } = await supabase.from('task').delete().eq('task_id', itemId);
        if (taskError) throw taskError;

    } else if (itemType === 'user') {
        // --- Permanently Deleting a User ---
        // To prevent foreign key constraint errors, we must first handle all records that reference this user.
        // 1. Delete the user's assignments from tasks, their time logs, and their notes.
        await Promise.all([
            supabase.from('taskworker').delete().eq('user_id', itemId),
            supabase.from('taskdailytime').delete().eq('user_id', itemId),
            supabase.from('tasknote').delete().eq('user_id', itemId)
        ]).then(results => {
            for (const result of results) {
                if (result.error) throw result.error;
            }
        });
        
        // 2. Anonymize audit logs by setting the user_id to null to preserve history.
        // This is necessary because the foreign key constraint prevents user deletion otherwise.
        const { error: auditLogError } = await supabase
            .from('auditlogs')
            .update({ user_id: null })
            .eq('user_id', itemId);

        if (auditLogError) throw auditLogError;

        // 3. After all dependencies are removed or anonymized, delete the user record itself.
        const { error } = await supabase.from('users').delete().eq('user_id', itemId);
        if (error) throw error;
    }
};

// Other ERP functions are not implemented for Supabase yet.
export const addQuotation = (q: any) => Promise.resolve({ ...q });
export const updateQuotation = (q: any) => Promise.resolve({ ...q });
export const updateQuotationStatus = (id: string, s: any) => Promise.resolve({id, status: s});
export const convertQuotationToOrder = (id: string) => Promise.resolve(null);
export const updateOrderStatus = (id: string, s: any) => Promise.resolve({id, status: s});
export const addShipment = (s: any) => Promise.resolve({ ...s });