import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import serverless from 'serverless-http';

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.vercel.app'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());

// Express JSON
app.use(express.json());

// Firebase Admin initialization
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
  } else {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } catch (e) {
      console.error('Firebase Admin init failed', e);
    }
  }
}

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// In-memory fallback
const userIdToTokens = new Map();

// Notify task assigned
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
    tokens = (data || []).map(d => d.fcm_token);
  } else {
    for (const userId of assignedWorkerIds) {
      const set = userIdToTokens.get(userId);
      if (set) tokens.push(...Array.from(set));
    }
  }

  if (tokens.length === 0) {
    return res.json({ sent: 0, message: 'No tokens registered for assigned workers' });
  }

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
    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: payload.notification,
      data: payload.data,
    });
    return res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Export for Vercel
export default serverless(app);
