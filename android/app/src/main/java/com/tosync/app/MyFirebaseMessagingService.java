package com.tosync.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "task_channel";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String title = null;
        String body = null;
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }
        if (title == null) title = "New Task Assigned";
        if (body == null) body = "You have a new task!";

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Task Notifications", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Notifications for task assignments");
            channel.enableLights(true);
            channel.setLightColor(Color.BLUE);
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0));

        int smallIcon = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
        if (smallIcon == 0) {
            smallIcon = getApplicationInfo().icon; // fallback to app icon
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(smallIcon)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    @Override
    public void onNewToken(String token) {
        // Register token with backend
        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL("http://10.0.2.2:5050/register-token"); // Use 10.0.2.2 for Android emulator localhost
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                // Get current user ID from SharedPreferences (set by Capacitor Preferences)
                android.content.SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String currentUserId = prefs.getString("current_user_id", null);
                
                if (currentUserId != null) {
                    String payload = "{\"userId\":\"" + currentUserId + "\",\"fcmToken\":\"" + token + "\"}";
                    try (java.io.OutputStream os = conn.getOutputStream()) {
                        os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    }
                    int responseCode = conn.getResponseCode();
                    android.util.Log.d("FCM", "Token registration response: " + responseCode);
                }
                conn.disconnect();
            } catch (Exception e) {
                android.util.Log.e("FCM", "Failed to register token", e);
            }
        }).start();
    }
}


