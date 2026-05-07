-- ═══════════════════════════════════════════════════════════════════════════
--  Switch to Firebase Auth — add firebase_uid to profiles + disable RLS
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Add firebase_uid and email to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Disable RLS on all tables (Firebase handles auth, app handles filtering)
ALTER TABLE profiles          DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE products          DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections       DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items        DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders            DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners           DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images       DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner_settings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings    DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE promos            DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
