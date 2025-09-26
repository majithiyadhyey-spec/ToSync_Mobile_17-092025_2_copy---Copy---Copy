import { FirebaseMessaging } from '@capacitor-firebase/messaging';

export async function registerPush(userId: string) {
  try {
    // Request notification permission
    const perm = await FirebaseMessaging.requestPermissions();
    if (perm.receive !== 'granted') {
        console.warn('Push notifications permission denied by user.');
        return;
    }

    // Get FCM token
    const { token } = await FirebaseMessaging.getToken();
    console.log('FCM Token:', token);

    // Listen for incoming notifications
    FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('Push received:', notification);
    });

    // Register token with backend
    if (token) {
        const backendUrl = 'https://tosync-mobile-backend-m3nfh1a2w-majithiyadhyey-1000s-projects.vercel.app';
        try {
            const response = await fetch(`${backendUrl}/register-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, fcmToken: token }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Failed to register token. Server responded with status ${response.status}: ${errorBody}`);
            } else {
                console.log('Device token registered successfully.');
            }
        } catch (networkError) {
            console.error('Failed to send token registration request:', networkError);
        }
    }
  } catch (e) {
    console.error('Push registration failed', e);
  }
}