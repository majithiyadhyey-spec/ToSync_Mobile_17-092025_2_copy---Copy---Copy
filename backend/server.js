// /api/notify-task-assigned.js
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import fs from 'fs';
import serverless from 'serverless-http';

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error('Firebase Admin initialization failed.', e);
    }
  }
}

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// In-memory fallback token store
const userIdToTokens = new Map();

// Express app
import express from 'express';
const app = express();

// CORS middleware
import cors from 'cors';
const allowedOrigins = ['http://localhost:5173', 'https://your-frontend-domain.vercel.app'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors()); // handle preflight OPTIONS

app.use(express.json());

// POST /notify-task-assigned
app.post('/notify-task-assigned', async (req, res) => {
  try {
    const { assignedWorkerIds, taskName, taskId, projectName } = req.body || {};
    if (!assignedWorkerIds || !Array.isArray(assignedWorkerIds) || assignedWorkerIds.length === 0) {
      return res.status(400).json({ error: 'assignedWorkerIds array is required' });
    }

    // Collect tokens
    let tokens = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('user_devices')
        .select('fcm_token')
        .in('user_id', assignedWorkerIds);
      if (error) throw error;
      tokens = data.map(d => d.fcm_token).filter(Boolean);
    } else {
      // fallback in-memory tokens
      for (let userId of assignedWorkerIds) {
        const userTokens = userIdToTokens.get(userId);
        if (userTokens) tokens.push(...Array.from(userTokens));
      }
    }

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No device tokens found for assigned workers' });
    }

    // Send FCM notification
    const message = {
      notification: {
        title: `Task Assigned: ${taskName}`,
        body: `You have been assigned to task "${taskName}" in project "${projectName}"`,
      },
      tokens,
    };
    const response = await admin.messaging().sendMulticast(message);

    res.json({
      ok: true,
      message: 'Notifications sent',
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (e) {
    console.error('notify-task-assigned failed:', e);
    res.status(500).json({ error: 'Failed to send notifications', details: e.message });
  }
});

export default serverless(app);
