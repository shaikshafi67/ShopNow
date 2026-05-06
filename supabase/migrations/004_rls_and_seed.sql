-- ═══════════════════════════════════════════════════════════════════════════
-- ShopNow — Complete Remaining Setup (RLS + Seed + Policies)
-- Run this in Supabase SQL Editor ONCE
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable RLS on ALL tables ────────────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (safe IF NOT EXISTS wrappers) ──────────────────────────────

-- Profiles
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_profile_select') THEN CREATE POLICY own_profile_select ON profiles FOR SELECT USING (auth.uid()=id OR is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_profile_insert') THEN CREATE POLICY own_profile_insert ON profiles FOR INSERT WITH CHECK (auth.uid()=id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_profile_update') THEN CREATE POLICY own_profile_update ON profiles FOR UPDATE USING (auth.uid()=id OR is_admin()); END IF; END $$;

-- Addresses
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_addresses') THEN CREATE POLICY own_addresses ON addresses FOR ALL USING (auth.uid()=user_id); END IF; END $$;

-- Products — public read, admin write
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='products_select') THEN CREATE POLICY products_select ON products FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='products_admin') THEN CREATE POLICY products_admin ON products FOR ALL USING (is_admin()); END IF; END $$;

-- Collections
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='collections_select') THEN CREATE POLICY collections_select ON collections FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='collections_admin') THEN CREATE POLICY collections_admin ON collections FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='col_products_select') THEN CREATE POLICY col_products_select ON collection_products FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='col_products_admin') THEN CREATE POLICY col_products_admin ON collection_products FOR ALL USING (is_admin()); END IF; END $$;

-- Cart & Wishlist
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_cart') THEN CREATE POLICY own_cart ON cart_items FOR ALL USING (auth.uid()=user_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_wishlist') THEN CREATE POLICY own_wishlist ON wishlist_items FOR ALL USING (auth.uid()=user_id); END IF; END $$;

-- Orders
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='orders_select') THEN CREATE POLICY orders_select ON orders FOR SELECT USING (auth.uid()=user_id OR is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='orders_insert') THEN CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (auth.uid()=user_id OR user_id IS NULL); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='orders_update') THEN CREATE POLICY orders_update ON orders FOR UPDATE USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='order_items_select') THEN CREATE POLICY order_items_select ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id=order_items.order_id AND (o.user_id=auth.uid() OR is_admin()))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='order_items_insert') THEN CREATE POLICY order_items_insert ON order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id=order_items.order_id AND (o.user_id=auth.uid() OR user_id IS NULL))); END IF; END $$;

-- Discounts
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='discounts_select') THEN CREATE POLICY discounts_select ON discounts FOR SELECT USING (status='active' OR is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='discounts_admin') THEN CREATE POLICY discounts_admin ON discounts FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='discounts_update') THEN CREATE POLICY discounts_update ON discounts FOR UPDATE USING (TRUE); END IF; END $$;

-- Public read tables
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='banners_select') THEN CREATE POLICY banners_select ON banners FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='banners_admin') THEN CREATE POLICY banners_admin ON banners FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hero_select') THEN CREATE POLICY hero_select ON hero_images FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hero_admin') THEN CREATE POLICY hero_admin ON hero_images FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bsettings_select') THEN CREATE POLICY bsettings_select ON banner_settings FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bsettings_admin') THEN CREATE POLICY bsettings_admin ON banner_settings FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='annc_select') THEN CREATE POLICY annc_select ON announcements FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='annc_admin') THEN CREATE POLICY annc_admin ON announcements FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='brand_select') THEN CREATE POLICY brand_select ON brand_settings FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='brand_admin') THEN CREATE POLICY brand_admin ON brand_settings FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='pages_select') THEN CREATE POLICY pages_select ON pages FOR SELECT USING (status='published' OR is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='pages_admin') THEN CREATE POLICY pages_admin ON pages FOR ALL USING (is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='promos_select') THEN CREATE POLICY promos_select ON promos FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='promos_admin') THEN CREATE POLICY promos_admin ON promos FOR ALL USING (is_admin()); END IF; END $$;

-- Notifications & Reviews
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='own_notifications') THEN CREATE POLICY own_notifications ON notifications FOR ALL USING (auth.uid()=user_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reviews_select') THEN CREATE POLICY reviews_select ON reviews FOR SELECT USING (TRUE); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reviews_insert') THEN CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid()=user_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='reviews_delete') THEN CREATE POLICY reviews_delete ON reviews FOR DELETE USING (auth.uid()=user_id OR is_admin()); END IF; END $$;

-- ── Seed Data ───────────────────────────────────────────────────────────────
INSERT INTO brand_settings (id, brand_name) VALUES (1, 'ShopNow') ON CONFLICT DO NOTHING;
INSERT INTO banner_settings (id, preset) VALUES (1, 'fullscreen') ON CONFLICT DO NOTHING;
INSERT INTO hero_images (id) VALUES ('men'), ('women') ON CONFLICT DO NOTHING;

INSERT INTO announcements (id, is_active, items) VALUES
  ('home', TRUE,  ARRAY['Free shipping on orders over ₹999', 'New arrivals every week', 'Use code SAVE10 for 10% off']),
  ('men',  FALSE, ARRAY['New Men''s Collection out now', 'Free shipping over ₹999']),
  ('women',FALSE, ARRAY['New Women''s Collection out now', 'Free shipping over ₹999'])
ON CONFLICT DO NOTHING;

INSERT INTO promos (id, is_active, data) VALUES
  ('home',  FALSE, '{"badge":"Flash Sale","headline":"50% OFF","subline":"SELECTED STYLES","code":"SAVE50","btn1Label":"Shop Men","btn1Link":"/men","btn2Label":"Shop Women","btn2Link":"/women"}'::jsonb),
  ('men',   FALSE, '{"title":"Men''s Sale — Up to 40% Off","subtitle":"Limited time offer","code":"MEN40","btnLabel":"Shop Now"}'::jsonb),
  ('women', FALSE, '{"title":"Women''s Sale — Up to 40% Off","subtitle":"Limited time offer","code":"WOMEN40","btnLabel":"Shop Now"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO discounts (title, code, type, value, status, min_order_value) VALUES
  ('Welcome Discount', 'WELCOME10', 'percentage_off_order', 10, 'active', 200),
  ('Save ₹100',        'SAVE100',   'amount_off_order',    100, 'active', 500)
ON CONFLICT DO NOTHING;

-- ── Storage Buckets ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners',  'banners',  true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('brand',    'brand',    true, 2097152,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('hero',     'hero',     true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='products_public_read' AND tablename='objects') THEN CREATE POLICY products_public_read ON storage.objects FOR SELECT USING (bucket_id='products'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='products_admin_insert' AND tablename='objects') THEN CREATE POLICY products_admin_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id='products' AND is_admin()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='banners_public_read' AND tablename='objects') THEN CREATE POLICY banners_public_read ON storage.objects FOR SELECT USING (bucket_id='banners'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='brand_public_read' AND tablename='objects') THEN CREATE POLICY brand_public_read ON storage.objects FOR SELECT USING (bucket_id='brand'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hero_public_read' AND tablename='objects') THEN CREATE POLICY hero_public_read ON storage.objects FOR SELECT USING (bucket_id='hero'); END IF; END $$;
