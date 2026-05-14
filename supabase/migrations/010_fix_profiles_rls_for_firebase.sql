-- ═══════════════════════════════════════════════════════════════════════
--  Fix ALL RLS policies for Firebase Auth
--  The app uses Firebase Auth, not Supabase Auth, so auth.uid() is always
--  NULL. Open all tables to anon key — Firebase handles auth security.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_profile_select" ON profiles;
DROP POLICY IF EXISTS "own_profile_insert" ON profiles;
DROP POLICY IF EXISTS "own_profile_update" ON profiles;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE USING (true);

-- ── Addresses ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_addresses" ON addresses;

CREATE POLICY "addresses_select_all" ON addresses FOR SELECT USING (true);
CREATE POLICY "addresses_insert_all" ON addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "addresses_update_all" ON addresses FOR UPDATE USING (true);
CREATE POLICY "addresses_delete_all" ON addresses FOR DELETE USING (true);

-- ── Notifications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_notifications" ON notifications;

CREATE POLICY "notifications_select_all" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete_all" ON notifications FOR DELETE USING (true);

-- ── Orders ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;

CREATE POLICY "orders_select_all"      ON orders      FOR SELECT USING (true);
CREATE POLICY "orders_insert_all"      ON orders      FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_all"      ON orders      FOR UPDATE USING (true);
CREATE POLICY "order_items_select_all" ON order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert_all" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update_all" ON order_items FOR UPDATE USING (true);
