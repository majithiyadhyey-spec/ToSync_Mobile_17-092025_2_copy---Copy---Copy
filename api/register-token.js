const { createClient } = require('@supabase/supabase-js');

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, fcmToken } = req.body || {};
  if (!userId || !fcmToken) {
    return res.status(400).json({ error: 'userId and fcmToken are required' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized' });
  }

  try {
    const { error } = await supabase
      .from('user_devices')
      .upsert({ user_id: userId, fcm_token: fcmToken }, { onConflict: 'user_id,fcm_token' });
    if (error) throw error;
    return res.json({ ok: true, persisted: true });
  } catch (e) {
    console.error('register-token failed', e);
    return res.status(500).json({ error: 'Failed to register token' });
  }
};
