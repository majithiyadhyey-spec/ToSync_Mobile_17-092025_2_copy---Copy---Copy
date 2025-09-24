const admin = require('firebase-admin');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== Initialize Firebase Admin =====
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;

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
      console.error(
        'Firebase Admin initialization failed. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.'
      );
    }
  }
}

// ===== Initialize Supabase =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// ===== Vercel serverless function =====
module.exports = async (req, res) => {
  // ===== CORS Headers =====
  const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'https://tosyncm24092025-ibpbbpps5-majithiyadhyey-1000s-projects.vercel.app/';
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { assignedWorkerIds, taskName, taskId, projectName } = req.body || {};

  if (!assignedWorkerIds || !Array.isArray(assignedWorkerIds) || assignedWorkerIds.length === 0) {
    return res.status(400).json({ error: 'assignedWorkerIds array is required' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  // ===== Fetch FCM tokens for assigned workers =====
  let tokens = [];
  const { data, error } = await supabase
    .from('user_devices')
    .select('fcm_token')
    .in('user_id', assignedWorkerIds);

  if (error) {
    console.error('Failed to fetch tokens:', error);
    return res.status(500).json({ error: 'Failed to fetch tokens' });
  }

  tokens = (data || []).map(r => r.fcm_token);

  if (tokens.length === 0) {
    return res.json({ sent: 0, message: 'No tokens registered for assigned workers' });
  }

  // ===== Build notification payload =====
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

  // ===== Send notifications via FCM =====
  try {
    const response = await admin.messaging().sendEachForMulticast({ tokens, ...payload });
    console.log(
      `Notification sent to ${response.successCount} device(s) for task: "${taskName}"`
    );
    return res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error('Error sending notifications:', err);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
};
