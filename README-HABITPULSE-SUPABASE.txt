HabitPulse — Supabase edition

This source version replaces local IndexedDB authentication/data storage with Supabase Auth + PostgreSQL.

Required Vite environment variables:
VITE_SUPABASE_URL=https://thcirvtapxtugqgnxyrr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your Supabase publishable key>

Important: this is SOURCE CODE and must be built with `npm install` then `npm run build`. Upload the resulting `dist` folder to Netlify Drop, or connect this source repository to Netlify so Netlify performs the build.

Database: supabase/schema.sql contains the production schema/RLS reference. If your existing Supabase project already has the tables and RLS patch applied, do not blindly rerun destructive changes.
