# Backend

This folder will contain a minimal Node.js Express server to send Firebase Cloud Messaging (FCM) notifications when a task is assigned.

Endpoints to implement:

- POST `/register-token` — save or update a worker's device FCM token.
- POST `/notify-task-assigned` — send a push notification to all assigned workers for a task.

Setup steps:

1) Create a Firebase service account JSON and set env var `GOOGLE_APPLICATION_CREDENTIALS` to its path, or put it at `backend/serviceAccountKey.json` and set `FIREBASE_SERVICE_ACCOUNT` to that path.
2) (Optional but recommended) Use Supabase to persist device tokens. Add a table:

```
create table user_devices (
  user_id uuid not null,
  fcm_token text not null,
  updated_at timestamptz default now(),
  primary key (user_id, fcm_token)
);
```

Set env vars so the backend can read/write tokens:

```
SUPABASE_URL=...             # from your Supabase project
SUPABASE_SERVICE_KEY=...      # service role key (secure, keep server-side)
```

3) Install dependencies in this folder:
   - `npm init -y`
   - `npm install express cors firebase-admin dotenv @supabase/supabase-js`
3) Run the server: `node server.js`


This directory is a placeholder for future backend code (e.g., Node.js, Express, database logic).
