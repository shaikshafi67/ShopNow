-- ═══════════════════════════════════════════════════════════════════════════
--  ShopNow — Fix Missing Seed Data
--  Run this in Supabase SQL Editor to fix empty tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Brand Settings ───────────────────────────────────────────────────────────
INSERT INTO brand_settings (id, brand_name, facebook, instagram, youtube)
VALUES (1, 'ShopNow', '', '', '')
ON CONFLICT (id) DO UPDATE SET brand_name = 'ShopNow';

-- ── Banner Settings ──────────────────────────────────────────────────────────
INSERT INTO banner_settings (id, preset)
VALUES (1, 'fullscreen')
ON CONFLICT (id) DO UPDATE SET preset = 'fullscreen';

-- ── Hero Images ──────────────────────────────────────────────────────────────
INSERT INTO hero_images (id) VALUES ('men'), ('women')
ON CONFLICT (id) DO NOTHING;

-- ── Announcements ────────────────────────────────────────────────────────────
INSERT INTO announcements (id, is_active, bg_from, bg_to, bg_dir, text_color, speed, separator, items)
VALUES
  ('home', TRUE,  '#7c6aff', '#a78bfa', '135deg', '#ffffff', 25, '✦',
   ARRAY['Free shipping on orders over ₹999', 'New arrivals every week', 'Use code SAVE10 for 10% off']),
  ('men',  FALSE, '#7c6aff', '#a78bfa', '135deg', '#ffffff', 25, '✦',
   ARRAY['New Men''s Collection out now', 'Free shipping over ₹999']),
  ('women',FALSE, '#7c6aff', '#a78bfa', '135deg', '#ffffff', 25, '✦',
   ARRAY['New Women''s Collection out now', 'Free shipping over ₹999'])
ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  items     = EXCLUDED.items;

-- ── Promos ───────────────────────────────────────────────────────────────────
INSERT INTO promos (id, is_active, data)
VALUES
  ('home', FALSE,
   '{"badge":"Flash Sale","headline":"50% OFF","subline":"SELECTED STYLES","code":"SAVE50","btn1Label":"Shop Men","btn1Link":"/men","btn2Label":"Shop Women","btn2Link":"/women"}'::jsonb),
  ('men', FALSE,
   '{"title":"Men''s Sale — Up to 40% Off","subtitle":"Limited time offer","code":"MEN40","btnLabel":"Shop Now"}'::jsonb),
  ('women', FALSE,
   '{"title":"Women''s Sale — Up to 40% Off","subtitle":"Limited time offer","code":"WOMEN40","btnLabel":"Shop Now"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── Storage Buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners',  'banners',  true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('brand',    'brand',    true, 2097152,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('hero',     'hero',     true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── Storage Policies ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='products_pub_read' AND schemaname='storage') THEN
    CREATE POLICY products_pub_read  ON storage.objects FOR SELECT USING (bucket_id = 'products');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='banners_pub_read' AND schemaname='storage') THEN
    CREATE POLICY banners_pub_read   ON storage.objects FOR SELECT USING (bucket_id = 'banners');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='brand_pub_read' AND schemaname='storage') THEN
    CREATE POLICY brand_pub_read     ON storage.objects FOR SELECT USING (bucket_id = 'brand');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hero_pub_read' AND schemaname='storage') THEN
    CREATE POLICY hero_pub_read      ON storage.objects FOR SELECT USING (bucket_id = 'hero');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='storage_admin_all' AND schemaname='storage') THEN
    CREATE POLICY storage_admin_all  ON storage.objects FOR ALL USING (is_admin());
  END IF;
END $$;

-- ── Verify everything ────────────────────────────────────────────────────────
SELECT 'brand_settings'  AS tbl, COUNT(*) FROM brand_settings  UNION ALL
SELECT 'banner_settings' AS tbl, COUNT(*) FROM banner_settings  UNION ALL
SELECT 'hero_images'     AS tbl, COUNT(*) FROM hero_images      UNION ALL
SELECT 'announcements'   AS tbl, COUNT(*) FROM announcements    UNION ALL
SELECT 'promos'          AS tbl, COUNT(*) FROM promos           UNION ALL
SELECT 'storage_buckets' AS tbl, COUNT(*) FROM storage.buckets;
