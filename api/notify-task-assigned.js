import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!admin.apps.length && serviceAccountPath) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

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
    tokens = (data || []).map(r => r.fcm_token);
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
    return res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
}
