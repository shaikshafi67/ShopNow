-- ═══════════════════════════════════════════════════════════════════════
--  Fix profiles table to work with Firebase Auth (not Supabase Auth)
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Drop the FK that links profiles.id → auth.users (Firebase users
--    are not in auth.users, so inserts would fail without this)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Give profiles.id a default so we can insert without specifying id
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Add firebase_uid and email columns (skip if already added)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Drop the auth trigger (no longer needed — profiles created by app)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
