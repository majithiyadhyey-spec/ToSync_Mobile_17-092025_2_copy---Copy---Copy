// // src/services/notifications.ts
// import { PushNotifications } from '@capacitor/push-notifications';

// export async function registerPush(userId: string) {
//   try {
//     let permStatus = await PushNotifications.checkPermissions();
//     if (permStatus.receive !== 'granted') {
//       permStatus = await PushNotifications.requestPermissions();
//     }

//     if (permStatus.receive !== 'granted') {
//       console.log('User denied permissions!');
//       return;
//     }

//     await PushNotifications.register();

//     PushNotifications.addListener('registration', async (token) => {
//       console.log('Device token: ', token.value);

//       const backendUrl = process.env.REACT_APP_NOTIFICATION_SERVER_URL || 'http://localhost:5050';
      
//       try {
//         const response = await fetch(`${backendUrl}/register-token`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ userId, fcmToken: token.value }),
//         });

//         if (!response.ok) {
//           const errorBody = await response.text();
//           console.error(`Failed to register token. Server responded with status ${response.status}: ${errorBody}`);
//         } else {
//           console.log('Device token registered successfully.');
//         }
//       } catch (networkError) {
//         console.error('Failed to send token registration request:', networkError);
//       }
//     });

//     PushNotifications.addListener('registrationError', (error) => {
//       console.error('Error on registration: ' + JSON.stringify(error));
//     });

//   } catch (e) {
//     console.error('Push registration failed', e);
//   }
// }

// src/services/notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Registers the device for push notifications and sends the FCM token to the backend.
 * @param userId - The ID of the current user (used for mapping tokens)
 */
export async function registerPush(userId: string) {
  console.log('registerPush function called for userId:', userId);
  try {
    // Step 1: Check existing permission
    let permStatus = await PushNotifications.checkPermissions();
    console.log('Initial push notification permission status:', permStatus.receive);

    // Step 2: Request permission if not granted
    if (permStatus.receive !== 'granted') {
      console.log('Requesting push notification permissions...');
      permStatus = await PushNotifications.requestPermissions();
      console.log('After requesting, permission status:', permStatus.receive);
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notifications permission denied by user.');
      return;
    }

    // Step 3: Register device for push notifications
    console.log('Registering device for push notifications...');
    await PushNotifications.register();
    console.log('Device registration initiated.');

    // Step 4: Handle successful registration
    PushNotifications.addListener('registration', async (token) => {
      console.log('Capacitor PushNotifications registration event - Device token:', token.value);

      // Backend URL
      const backendUrl = 'https://tosync-fxnausxrh-majithiyadhyey-1000s-projects.vercel.app';
      console.log('Attempting to send FCM token to backend:', backendUrl);

      try {
        const response = await fetch(`${backendUrl}/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fcmToken: token.value }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `Failed to register token. Server responded with status ${response.status}: ${errorBody}`
          );
        } else {
          console.log('Device token registered successfully with backend.');
        }
      } catch (networkError) {
        console.error('Failed to send token registration request to backend:', networkError);
      }
    });

    // Step 5: Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Capacitor Push registration error:', JSON.stringify(error));
    });

    // Step 6: Optional listener for incoming notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Capacitor Push notification received:', notification);
    });
  } catch (e) {
    console.error('Push registration failed at top level catch:', e);
  }
}
