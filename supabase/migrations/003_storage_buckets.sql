-- ═══════════════════════════════════════════════════════════════════════════
--  ShopNow — Storage Buckets
--  Run this AFTER creating the buckets in Supabase Dashboard:
--  Storage → New bucket → (name, public: true)
-- ═══════════════════════════════════════════════════════════════════════════

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners',  'banners',  true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('brand',    'brand',    true, 2097152,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('hero',     'hero',     true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ─────────────────────────────────────────────────────

-- products bucket: public read, admin write
CREATE POLICY "products_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "products_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND is_admin());
CREATE POLICY "products_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND is_admin());
CREATE POLICY "products_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND is_admin());

-- banners bucket: public read, admin write
CREATE POLICY "banners_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "banners_admin_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND is_admin());
CREATE POLICY "banners_admin_delete"  ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND is_admin());

-- brand bucket: public read, admin write
CREATE POLICY "brand_public_read"     ON storage.objects FOR SELECT USING (bucket_id = 'brand');
CREATE POLICY "brand_admin_insert"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand' AND is_admin());
CREATE POLICY "brand_admin_delete"    ON storage.objects FOR DELETE USING (bucket_id = 'brand' AND is_admin());

-- hero bucket: public read, admin write
CREATE POLICY "hero_public_read"      ON storage.objects FOR SELECT USING (bucket_id = 'hero');
CREATE POLICY "hero_admin_insert"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hero' AND is_admin());
CREATE POLICY "hero_admin_delete"     ON storage.objects FOR DELETE USING (bucket_id = 'hero' AND is_admin());
