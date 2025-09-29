import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

interface PushNotificationService {
    isRegistered: boolean;
    currentToken: string | null;
}

class PushNotificationManager {
    private static instance: PushNotificationManager;
    private service: PushNotificationService = {
        isRegistered: false,
        currentToken: null
    };
  
    private readonly backendUrl = 'https://tosync-mobile-backend-m3nfh1a2w-majithiyadhyey-1000s-projects.vercel.app';

    static getInstance(): PushNotificationManager {
        if (!PushNotificationManager.instance) {
            PushNotificationManager.instance = new PushNotificationManager();
        }
        return PushNotificationManager.instance;
    }

    /**
     * Initialize push notifications with enhanced error handling and token refresh
     */
    async registerPush(userId: string): Promise<boolean> {
        try {
            // Check if FCM is available on this platform
            if (!Capacitor.isPluginAvailable('FirebaseMessaging')) {
                console.warn('Firebase Messaging plugin not available on this platform');
                return false;
            }

            // Request notification permission
            const perm = await FirebaseMessaging.requestPermissions();
            if (perm.receive !== 'granted') {
                console.warn('Push notifications permission denied by user.');
                return false;
            }

            // Get FCM token
            const { token } = await FirebaseMessaging.getToken();
            if (!token) {
                console.error('Failed to get FCM token');
                return false;
            }

            console.log('FCM Token:', token);
            this.service.currentToken = token;

            // Set up listeners before registering token
            this.setupNotificationListeners();

            // Register token with backend
            const registered = await this.registerTokenWithBackend(userId, token);
            if (registered) {
                this.service.isRegistered = true;
                console.log('Push notifications successfully initialized');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Push registration failed:', error);
            return false;
        }
    }

    /**
     * Set up comprehensive notification listeners
     */
    private setupNotificationListeners(): void {
        // Handle foreground notifications
        FirebaseMessaging.addListener('notificationReceived', (notification) => {
            console.log('Push notification received in foreground:', notification);
            this.handleForegroundNotification(notification);
        });

        // Handle notification taps (when app is in background/closed)
        FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
            console.log('Notification action performed:', action);
            this.handleNotificationTap(action);
        });

        // Handle token refresh
        FirebaseMessaging.addListener('tokenReceived', async (event) => {
            console.log('FCM token refreshed:', event.token);
            this.service.currentToken = event.token;
      
            // Re-register with backend if we have a stored user ID
            const userId = this.getCurrentUserId(); // You'll need to implement this
            if (userId) {
                await this.registerTokenWithBackend(userId, event.token);
            }
        });
    }

    /**
     * Handle notifications received while app is in foreground
     */
    private handleForegroundNotification(notification: any): void {
        // You can customize this based on your app's needs
        // For example, show an in-app banner or update UI state
    
        if (notification.data?.type === 'task_assigned') {
            // Handle task assignment notifications
            this.handleTaskAssignmentNotification(notification.data);
        }
    
        // Optionally show a local notification even in foreground
        // This depends on your UX requirements
    }

    /**
     * Handle notification taps (background/closed app scenarios)
     */
    private handleNotificationTap(action: any): void {
        const { notification } = action;
    
        if (notification.data?.type === 'task_assigned') {
            // Navigate to specific task or project view
            this.navigateToTask(notification.data.taskId);
        }
    
        // Add more notification types as needed
    }

    /**
     * Handle task assignment specific logic
     */
    private handleTaskAssignmentNotification(data: any): void {
        // Update local app state, refresh task list, etc.
        console.log('New task assigned:', data.taskName);

        // In a real app, you would use a toast notification library
        alert(`New Task Assigned: ${data.taskName} in project ${data.projectName}`);
    
        // Emit custom event for app components to listen to
        window.dispatchEvent(new CustomEvent('taskAssigned', { 
            detail: { 
                taskId: data.taskId, 
                taskName: data.taskName,
                projectName: data.projectName 
            } 
        }));
    }

    /**
     * Navigate to specific task (implement based on your routing)
     */
    private navigateToTask(taskId: string): void {
        // Implementation depends on your routing setup
        // For React Router: navigate(`/tasks/${taskId}`)
        // For mobile apps, you might use deeplinks
        console.log('Navigate to task:', taskId);
    }

    /**
     * Register token with backend with retry logic
     */
    private async registerTokenWithBackend(userId: string, token: string): Promise<boolean> {
        const maxRetries = 3;
    
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.backendUrl}/register-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, fcmToken: token }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Token registered successfully:', result);
                    return true;
                } else {
                    const errorBody = await response.text();
                    console.error(`Token registration failed (attempt ${attempt}). Status ${response.status}: ${errorBody}`);
                }
            } catch (error) {
                console.error(`Token registration network error (attempt ${attempt}):`, error);
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                await this.sleep(1000 * Math.pow(2, attempt - 1));
            }
        }

        return false;
    }

    /**
     * Unregister push notifications (for logout)
     */
    async unregisterPush(userId: string): Promise<void> {
        try {
            if (this.service.currentToken) {
                // Optionally notify backend to remove token
                await fetch(`${this.backendUrl}/unregister-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, fcmToken: this.service.currentToken }),
                }).catch(err => console.warn('Failed to unregister token with backend:', err));
            }

            // Remove all listeners
            await FirebaseMessaging.removeAllListeners();
      
            this.service.isRegistered = false;
            this.service.currentToken = null;
      
            console.log('Push notifications unregistered');
        } catch (error) {
            console.error('Failed to unregister push notifications:', error);
        }
    }

    /**
     * Get current registration status
     */
    getStatus(): PushNotificationService {
        return { ...this.service };
    }

    /**
     * Helper method to get current user ID (implement based on your auth system)
     */
    private getCurrentUserId(): string | null {
        // Implementation depends on your auth context
        // You might get this from localStorage, context, or auth service
        return null; // Placeholder
    }

    /**
     * Utility sleep function
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();

// Convenience function for backward compatibility
export async function registerPush(userId: string): Promise<boolean> {
    return pushNotificationManager.registerPush(userId);
}