import { Project, Task, TaskStatus, User } from '../types';

/**
 * Sends a pre-formatted card object to a Microsoft Teams webhook URL.
 * Uses 'no-cors' mode as a fire-and-forget mechanism, which is common for client-side webhook calls.
 * @param webhookUrl The incoming webhook URL for the Teams channel.
 * @param card The Adaptive Card payload to send.
 * @returns A boolean indicating whether the request was sent without a network error.
 */
async function sendNotification(webhookUrl: string, card: object): Promise<boolean> {
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(card),
            mode: 'no-cors', // This prevents CORS errors from the browser.
        });
        // NOTE: With 'no-cors', we cannot check the response status.
        // We assume it succeeds if no network error is thrown.
        return true;
    } catch (error) {
        console.error('Error sending Teams notification:', error);
        return false;
    }
}

/**
 * A helper function to create a standardized Adaptive Card structure for notifications.
 * @param title The main title of the card.
 * @param project The project associated with the notification.
 * @param task The task associated with the notification.
 * @param facts An array of { title, value } objects to display in a FactSet.
 * @param color The color of the title text ('good', 'warning', 'attention', etc.).
 * @param qrCodeUrl Optional URL to an image of a QR code to include in the card.
 * @returns A fully formed Teams message payload with the Adaptive Card.
 */
function createAdaptiveCard(title: string, project: Project, task: Task, facts: any[], color: 'default' | 'accent' | 'good' | 'warning' | 'attention' = 'default', qrCodeUrl?: string) {
    const body: any[] = [
        {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            color: color
        },
        {
            type: 'TextBlock',
            text: task.name,
            wrap: true,
            isSubtle: true,
            size: 'Large'
        },
        {
            type: 'FactSet',
            facts: facts
        }
    ];

    if (qrCodeUrl) {
        body.push({
            type: 'Image',
            url: qrCodeUrl,
            altText: `QR Code for task: ${task.name}`,
            size: 'Medium',
            spacing: 'Large',
            separator: true
        });
    }

    return {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    version: '1.4',
                    body: body
                }
            }
        ]
    };
}

/**
 * Constructs and sends a notification for a newly created task.
 * @param task The newly created task object.
 * @param project The project the task belongs to.
 * @param allUsers A list of all users to resolve worker names.
 * @param webhookUrl The Teams webhook URL.
 * @param formatDate A utility function to format date strings.
 */
export async function sendTaskCreatedNotification(task: Task, project: Project, allUsers: User[], webhookUrl: string, formatDate: (dateString: string) => string) {
    const assignedWorkerNames = task.assignedWorkerIds
        .map(id => allUsers.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const facts = [
        { title: 'Project', value: `[${project.marking}] ${project.name}` },
        { title: 'Deadline', value: formatDate(task.deadline) },
        { title: 'Assigned To', value: assignedWorkerNames || 'None' }
    ];
    
    // Generate a QR code image URL for the task ID.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(task.id)}`;

    const card = createAdaptiveCard('New Task Created', project, task, facts, 'accent', qrCodeUrl);
    await sendNotification(webhookUrl, card);
}

/**
 * Constructs and sends a notification when a task's status changes.
 * @param task The updated task object.
 * @param project The project the task belongs to.
 * @param allUsers A list of all users to resolve worker names.
 * @param oldStatus The previous status of the task.
 * @param webhookUrl The Teams webhook URL.
 */
export async function sendTaskStatusChangeNotification(task: Task, project: Project, allUsers: User[], oldStatus: TaskStatus, webhookUrl: string) {
     const assignedWorkerNames = task.assignedWorkerIds
        .map(id => allUsers.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const statusMap = {
        [TaskStatus.Planned]: { color: 'default', title: 'Task Planned' },
        [TaskStatus.InProgress]: { color: 'warning', title: 'Task In Progress' },
        [TaskStatus.Completed]: { color: 'good', title: 'Task Completed' }
    };

    const facts = [
        { title: 'Project', value: `[${project.marking}] ${project.name}` },
        { title: 'Status', value: `Changed from **${oldStatus}** to **${task.status}**` },
        { title: 'Assigned To', value: assignedWorkerNames || 'None' }
    ];

    const card = createAdaptiveCard(
        statusMap[task.status].title,
        project,
        task,
        facts,
        statusMap[task.status].color as any
    );

    await sendNotification(webhookUrl, card);
}

/**
 * Sends a simple test notification to verify the webhook URL is correct and working.
 * @param webhookUrl The Teams webhook URL to test.
 * @returns A boolean indicating if the notification was sent successfully.
 */
export async function sendTestNotification(webhookUrl: string): Promise<boolean> {
    const card = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    version: '1.2',
                    body: [
                        {
                            type: 'TextBlock',
                            text: '✅ Connection Successful!',
                            weight: 'Bolder',
                            size: 'Medium',
                            color: 'Good'
                        },
                        {
                            type: 'TextBlock',
                            text: 'You will now receive notifications from TOSync in this channel.',
                            wrap: true
                        }
                    ]
                }
            }
        ]
    };
    return await sendNotification(webhookUrl, card);
}
