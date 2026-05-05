-- ═══════════════════════════════════════════════════════════════════════════
--  ShopNow — Complete Supabase Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('user', 'admin');
CREATE TYPE order_status   AS ENUM ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled');
CREATE TYPE discount_type  AS ENUM ('amount_off_order','percentage_off_order','amount_off_product','percentage_off_products','free_shipping');
CREATE TYPE page_status    AS ENUM ('published','hidden','draft');
CREATE TYPE product_gender AS ENUM ('men','women','unisex');

-- ── Helper: updated_at trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ── Helper: is_admin() ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  USERS & AUTH
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  role       user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE WHEN NEW.email = 'admin@shopnow.local' THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'Home',
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  line1      TEXT NOT NULL DEFAULT '',
  line2      TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  state      TEXT NOT NULL DEFAULT '',
  pincode    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ════════════════════════════════════════════════════════════════════════════
--  PRODUCTS & CATALOG
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2) NOT NULL,
  rating         NUMERIC(3,1) NOT NULL DEFAULT 4.0,
  reviews        INTEGER NOT NULL DEFAULT 0,
  category       TEXT NOT NULL DEFAULT '',
  gender         product_gender NOT NULL DEFAULT 'unisex',
  brand          TEXT NOT NULL DEFAULT 'ShopNow',
  tag            TEXT NOT NULL DEFAULT 'New',
  images         TEXT[] NOT NULL DEFAULT '{}',
  colors         TEXT[] NOT NULL DEFAULT '{}',
  sizes          TEXT[] NOT NULL DEFAULT '{}',
  stock          INTEGER NOT NULL DEFAULT 25,
  try_on_ready   BOOLEAN NOT NULL DEFAULT FALSE,
  free_shipping  BOOLEAN NOT NULL DEFAULT FALSE,
  weight         NUMERIC(8,2),
  length         NUMERIC(8,2),
  width          NUMERIC(8,2),
  height         NUMERIC(8,2),
  sku            TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_gender   ON products(gender);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active   ON products(is_active);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
--  COLLECTIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE collections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  image         TEXT,
  is_auto       BOOLEAN NOT NULL DEFAULT FALSE,
  auto_category TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_products (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);

-- ════════════════════════════════════════════════════════════════════════════
--  CART & WISHLIST
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty         INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 1 AND qty <= 99),
  size        TEXT,
  color_index INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, size, color_index)
);
CREATE INDEX idx_cart_user ON cart_items(user_id);

CREATE TABLE wishlist_items (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- ════════════════════════════════════════════════════════════════════════════
--  ORDERS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE orders (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number             TEXT NOT NULL UNIQUE,
  user_id            UUID REFERENCES profiles(id),
  user_email         TEXT NOT NULL DEFAULT '',
  status             order_status NOT NULL DEFAULT 'placed',
  subtotal           NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  savings            NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping           NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax                NUMERIC(10,2) NOT NULL DEFAULT 0,
  total              NUMERIC(10,2) NOT NULL DEFAULT 0,
  address            JSONB NOT NULL DEFAULT '{}',
  payment            JSONB NOT NULL DEFAULT '{}',
  timeline           JSONB NOT NULL DEFAULT '[]',
  estimated_delivery TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id),
  name           TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image          TEXT,
  size           TEXT,
  color_index    INTEGER,
  color_hex      TEXT,
  qty            INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ════════════════════════════════════════════════════════════════════════════
--  DISCOUNTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE discounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  code             TEXT NOT NULL UNIQUE,
  type             discount_type NOT NULL DEFAULT 'amount_off_order',
  value            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active',
  min_order_value  NUMERIC(10,2),
  usage_limit      INTEGER,
  used_count       INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  combine_products BOOLEAN NOT NULL DEFAULT FALSE,
  combine_orders   BOOLEAN NOT NULL DEFAULT FALSE,
  combine_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
--  BANNERS & HERO
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE banners (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image      TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  subtitle   TEXT NOT NULL DEFAULT '',
  link       TEXT NOT NULL DEFAULT '/',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hero_images (
  id         TEXT PRIMARY KEY,   -- 'men' | 'women'
  image_url  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE banner_settings (
  id        INTEGER PRIMARY KEY DEFAULT 1,
  preset    TEXT NOT NULL DEFAULT 'fullscreen',
  custom_vh INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
--  ANNOUNCEMENTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE announcements (
  id         TEXT PRIMARY KEY,   -- 'home' | 'men' | 'women'
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  bg_from    TEXT NOT NULL DEFAULT '#7c6aff',
  bg_to      TEXT NOT NULL DEFAULT '#a78bfa',
  bg_dir     TEXT NOT NULL DEFAULT '135deg',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  speed      INTEGER NOT NULL DEFAULT 25,
  separator  TEXT NOT NULL DEFAULT '✦',
  items      TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
--  BRAND
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE brand_settings (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  logo_url   TEXT,
  brand_name TEXT NOT NULL DEFAULT 'ShopNow',
  facebook   TEXT NOT NULL DEFAULT '',
  instagram  TEXT NOT NULL DEFAULT '',
  youtube    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
--  PAGES (CMS)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE pages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT NOT NULL DEFAULT '',
  status           page_status NOT NULL DEFAULT 'draft',
  meta_title       TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
--  PROMOS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE promos (
  id         TEXT PRIMARY KEY,   -- 'home' | 'men' | 'women'
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
--  NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- Addresses
CREATE POLICY "own_addresses"     ON addresses USING (auth.uid() = user_id);

-- Products — public read, admin write
CREATE POLICY "products_select"   ON products FOR SELECT USING (is_active OR is_admin());
CREATE POLICY "products_admin"    ON products FOR ALL    USING (is_admin());

-- Collections — public read, admin write
CREATE POLICY "collections_select" ON collections FOR SELECT USING (TRUE);
CREATE POLICY "collections_admin"  ON collections FOR ALL    USING (is_admin());
CREATE POLICY "col_products_select" ON collection_products FOR SELECT USING (TRUE);
CREATE POLICY "col_products_admin"  ON collection_products FOR ALL    USING (is_admin());

-- Cart
CREATE POLICY "own_cart"          ON cart_items  USING (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "own_wishlist"      ON wishlist_items USING (auth.uid() = user_id);

-- Orders — own or admin
CREATE POLICY "orders_select"     ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "orders_insert"     ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "orders_update"     ON orders FOR UPDATE USING (is_admin());
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR user_id IS NULL))
);

-- Discounts — public read active
CREATE POLICY "discounts_select"  ON discounts FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "discounts_admin"   ON discounts FOR ALL    USING (is_admin());

-- Public read-only tables
CREATE POLICY "banners_select"    ON banners           FOR SELECT USING (TRUE);
CREATE POLICY "banners_admin"     ON banners           FOR ALL    USING (is_admin());
CREATE POLICY "hero_select"       ON hero_images       FOR SELECT USING (TRUE);
CREATE POLICY "hero_admin"        ON hero_images       FOR ALL    USING (is_admin());
CREATE POLICY "bsettings_select"  ON banner_settings   FOR SELECT USING (TRUE);
CREATE POLICY "bsettings_admin"   ON banner_settings   FOR ALL    USING (is_admin());
CREATE POLICY "annc_select"       ON announcements     FOR SELECT USING (TRUE);
CREATE POLICY "annc_admin"        ON announcements     FOR ALL    USING (is_admin());
CREATE POLICY "brand_select"      ON brand_settings    FOR SELECT USING (TRUE);
CREATE POLICY "brand_admin"       ON brand_settings    FOR ALL    USING (is_admin());
CREATE POLICY "pages_select"      ON pages             FOR SELECT USING (status = 'published' OR is_admin());
CREATE POLICY "pages_admin"       ON pages             FOR ALL    USING (is_admin());
CREATE POLICY "promos_select"     ON promos            FOR SELECT USING (TRUE);
CREATE POLICY "promos_admin"      ON promos            FOR ALL    USING (is_admin());

-- Notifications
CREATE POLICY "own_notifications" ON notifications USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
--  SEED DATA
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO brand_settings (id, brand_name) VALUES (1, 'ShopNow') ON CONFLICT DO NOTHING;
INSERT INTO banner_settings (id, preset)   VALUES (1, 'fullscreen') ON CONFLICT DO NOTHING;
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
