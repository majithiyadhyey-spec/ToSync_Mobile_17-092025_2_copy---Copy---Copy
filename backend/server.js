/* eslint-disable */
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
  } else {
    // Fallback to application default credentials if available
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error('Firebase Admin initialization failed. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.');
      process.exit(1);
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client (for persistent token storage)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
} else {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Using in-memory token store.');
}

// In-memory fallback token store
const userIdToTokens = new Map();

// Register or update a worker's device token
app.post('/register-token', async (req, res) => {
  const { userId, fcmToken } = req.body || {};
  if (!userId || !fcmToken) {
    return res.status(400).json({ error: 'userId and fcmToken are required' });
  }
  try {
    if (supabase) {
      const { error } = await supabase
        .from('user_devices')
        .upsert({ user_id: userId, fcm_token: fcmToken }, { onConflict: 'user_id,fcm_token' });
      if (error) throw error;
      return res.json({ ok: true, persisted: true });
    }
    const tokens = userIdToTokens.get(userId) || new Set();
    tokens.add(fcmToken);
    userIdToTokens.set(userId, tokens);
    return res.json({ ok: true, persisted: false });
  } catch (e) {
    console.error('register-token failed', e);
    return res.status(500).json({ error: 'Failed to register token' });
  }
});

// Send notification when a task is assigned
app.post('/notify-task-assigned', async (req, res) => {
  const { assignedWorkerIds, taskName, taskId, projectName } = req.body || {};
  if (!assignedWorkerIds || !Array.isArray(assignedWorkerIds) || assignedWorkerIds.length === 0) {
    return res.status(400).json({ error: 'assignedWorkerIds array is required' });
  }

  let tokens = [];
  if (supabase) {
    const { data, error } = await supabase
      .from('user_devices')
      .select('fcm_token')
      .in('user_id', assignedWorkerIds);
    if (error) {
      console.error('fetch tokens failed', error);
      return res.status(500).json({ error: 'Failed to fetch tokens' });
    }
    tokens = (data || []).map(r => r.fcm_token);
  } else {
    for (const userId of assignedWorkerIds) {
      const set = userIdToTokens.get(userId);
      if (set && set.size > 0) {
        tokens.push(...set.values());
      }
    }
  }

  if (tokens.length === 0) {
    return res.json({ sent: 0, message: 'No tokens registered for assigned workers' });
  }

  const notification = {
    title: 'New Task Assigned',
    body: taskName ? `You have a new task: ${taskName}` : 'You have a new task!',
  };

  const payload = {
    notification,
    data: {
      type: 'task_assigned',
      taskId: String(taskId || ''),
      taskName: String(taskName || ''),
      projectName: String(projectName || ''),
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast({ tokens, ...payload });
    console.log(`Notification sent to ${response.successCount} device(s) for task: "${taskName}"`);
    return res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = app;