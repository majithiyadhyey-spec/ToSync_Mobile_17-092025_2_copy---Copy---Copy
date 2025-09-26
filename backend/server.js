// server.js
import express from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// ----- Manual CORS Headers -----
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173'); // local frontend
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200); // respond to preflight
  next();
});

app.use(express.json());

// ----- Firebase Admin Initialization -----
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
  } else {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } catch (e) {
      console.error('Firebase Admin initialization failed', e);
    }
  }
}

// ----- Supabase Client -----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// ----- In-Memory Fallback Token Store -----
const userIdToTokens = new Map();

// ----- Register Device Token -----
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

// ----- Notify Task Assigned -----
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
    if (error) return res.status(500).json({ error: 'Failed to fetch tokens' });
    tokens = (data || []).map(d => d.fcm_token).filter(Boolean);
  } else {
    for (const userId of assignedWorkerIds) {
      const set = userIdToTokens.get(userId);
      if (set) tokens.push(...Array.from(set));
    }
  }

  if (tokens.length === 0) return res.json({ sent: 0, message: 'No tokens registered' });

  const payload = {
    notification: {
      title: 'New Task Assigned',
      body: taskName ? `You have a new task: ${taskName}` : 'You have a new task!',
    },
    data: {
      type: 'task_assigned',
      taskId: String(taskId || ''),
      taskName: String(taskName || ''),
      projectName: String(projectName || ''),
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: payload.notification,
      data: payload.data,
    });

    // Optional: log failed tokens
    const failedTokens = response.responses
      .map((r, i) => (!r.success ? tokens[i] : null))
      .filter(Boolean);
    if (failedTokens.length > 0) {
      console.warn('Failed tokens:', failedTokens);
    }

    return res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// ----- Export for Vercel -----
export default serverless(app);
