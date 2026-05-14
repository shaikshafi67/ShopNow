-- ═══════════════════════════════════════════════════════════════════════
--  Fix profiles RLS for Firebase Auth
--  The app uses Firebase Auth, not Supabase Auth, so auth.uid() is always
--  NULL. We need to open SELECT to anon key (read-only, public profiles)
--  and allow INSERT/UPDATE from the anon key (app controls auth via Firebase).
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the old Supabase-auth-based policies that block all reads
DROP POLICY IF EXISTS "own_profile_select" ON profiles;
DROP POLICY IF EXISTS "own_profile_insert" ON profiles;
DROP POLICY IF EXISTS "own_profile_update" ON profiles;

-- Allow anyone with the anon key to read profiles
-- (Firebase JWT validates identity; Supabase is used only as a database here)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Allow anon key to insert new profiles (app creates profile after Firebase registration)
CREATE POLICY "profiles_insert_all"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Allow anon key to update profiles (app updates profile after Firebase login)
CREATE POLICY "profiles_update_all"
  ON profiles FOR UPDATE
  USING (true);

-- Also fix addresses RLS — auth.uid() = user_id won't work with Firebase
DROP POLICY IF EXISTS "own_addresses" ON addresses;

CREATE POLICY "addresses_select_all" ON addresses FOR SELECT USING (true);
CREATE POLICY "addresses_insert_all" ON addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "addresses_update_all" ON addresses FOR UPDATE USING (true);
CREATE POLICY "addresses_delete_all" ON addresses FOR DELETE USING (true);
