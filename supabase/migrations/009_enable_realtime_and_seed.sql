-- ═══════════════════════════════════════════════════════════════════════════
--  Enable Realtime for products table + seed initial products
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable realtime so home page updates instantly when admin adds products
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- ── Seed Products ────────────────────────────────────────────────────────────
INSERT INTO products (name, price, original_price, rating, reviews, category, gender, tag, images, colors, sizes, stock, try_on_ready, description, is_active) VALUES

('NOBERO Oversized Graphic Tee', 849, 1699, 4.3, 1240, 'T-Shirts', 'men', 'Bestseller',
  ARRAY['/images/men/tshirt/tshirt_3_1.jpg','/images/men/tshirt/tshirt_3_2.jpg','/images/men/tshirt/tshirt_3_3.jpg'],
  ARRAY['#1a1a1a','#8B0000','#1a3a6b'], ARRAY['XS','S','M','L','XL','XXL'], 25, true,
  'Premium oversized fit with bold typography. 100% pure cotton for all-day comfort.', true),

('Urban Street Premium Tee', 699, 1299, 4.1, 876, 'T-Shirts', 'men', 'New',
  ARRAY['/images/men/tshirt/tshirt_4_1.jpg','/images/men/tshirt/tshirt_4_2.jpg','/images/men/tshirt/tshirt_4_3.jpg'],
  ARRAY['#ffffff','#2d2d2d','#4a7c59'], ARRAY['S','M','L','XL'], 25, true,
  'Slim-fit street-style tee with premium cotton blend fabric.', true),

('Classic White Essential Tee', 499, 999, 4.4, 2100, 'T-Shirts', 'men', 'Bestseller',
  ARRAY['/images/men/tshirt/tshirt_5_1.jpg','/images/men/tshirt/tshirt_5_2.jpg'],
  ARRAY['#ffffff','#f5f5f5'], ARRAY['XS','S','M','L','XL','XXL'], 50, true,
  'The wardrobe essential. Pure white, pure cotton, pure comfort.', true),

('Oxford Check Casual Shirt', 1199, 2299, 4.3, 687, 'Shirts', 'men', 'Trending',
  ARRAY['/images/men/shirt/shirt_1_1.jpg','/images/men/shirt/shirt_1_2.jpg','/images/men/shirt/shirt_1_3.jpg'],
  ARRAY['#c8a97e','#5c7a8c','#2c3e50'], ARRAY['S','M','L','XL','XXL'], 25, false,
  'Classic Oxford weave shirt. Perfect for casual Fridays or weekend outings.', true),

('Slim Fit Dark Wash Jeans', 1599, 2999, 4.4, 1876, 'Jeans', 'men', 'Bestseller',
  ARRAY['/images/men/jeans/jeans_2_4.jpg','/images/men/jeans/jeans_2_3.jpg'],
  ARRAY['#1a1a2e','#2c3e50'], ARRAY['28','30','32','34','36'], 30, false,
  'Slim-fit stretch denim. Dark wash, premium finish.', true),

('Relaxed Fit Cargo Jeans', 1899, 3499, 4.2, 654, 'Jeans', 'men', 'Trending',
  ARRAY['/images/men/jeans/jeans_3_4.jpg','/images/men/jeans/jeans_3_3.jpg'],
  ARRAY['#4a3728','#2c3e50'], ARRAY['30','32','34','36'], 22, false,
  'Relaxed-fit with cargo pockets. Utility meets style.', true),

('Floral Print Anarkali Kurti', 899, 1799, 4.6, 2340, 'Kurtis', 'women', 'Bestseller',
  ARRAY['/images/women/kurtis/kurti_1_1.jpg','/images/women/kurtis/kurti_1_2.jpg','/images/women/kurtis/kurti_1_3.jpg'],
  ARRAY['#c2185b','#7b1fa2','#0277bd'], ARRAY['XS','S','M','L','XL','XXL'], 40, false,
  'Beautiful floral Anarkali with intricate print. Perfect for festive occasions.', true),

('Cotton Straight Kurti', 699, 1299, 4.4, 1560, 'Kurtis', 'women', 'New',
  ARRAY['/images/women/kurtis/kurti_2_1.jpg','/images/women/kurtis/kurti_2_2.jpg'],
  ARRAY['#f48fb1','#80cbc4','#fff176'], ARRAY['S','M','L','XL','XXL'], 35, false,
  'Everyday comfort in pure cotton. Minimal and elegant design.', true),

('Banarasi Silk Saree', 3499, 6999, 4.8, 432, 'Sarees', 'women', 'Premium',
  ARRAY['/images/women/saree/saree_1_3.jpg','/images/women/saree/saree_2_1.jpg'],
  ARRAY['#8b0000','#1a237e','#1b5e20'], ARRAY['Free Size'], 10, false,
  'Authentic Banarasi silk with zari work. A timeless classic.', true),

('Casual Short Kurti', 599, 1199, 4.3, 1230, 'Short Kurtis', 'women', 'New',
  ARRAY['/images/women/shortkurtis/sk1_1.jpg','/images/women/shortkurtis/sk1_2.jpg','/images/women/shortkurtis/sk1_3.jpg'],
  ARRAY['#f06292','#64b5f6','#81c784'], ARRAY['XS','S','M','L','XL','XXL'], 45, false,
  'Casual short kurti for everyday wear. Pair with jeans or leggings.', true),

('Satin Night Suit Set', 1099, 1999, 4.6, 543, 'Nightwear', 'women', 'Bestseller',
  ARRAY['/images/women/nightwear/nw1_1.jpg','/images/women/nightwear/nw1_2.jpg'],
  ARRAY['#f8bbd0','#e1bee7','#b2dfdb'], ARRAY['S','M','L','XL','XXL'], 30, false,
  'Luxuriously soft satin night suit. Sleep in style.', true),

('Crop Top Western Wear', 599, 1099, 4.4, 1123, 'Tops', 'women', 'Trending',
  ARRAY['/images/women/tops/top_2_1.jpg'],
  ARRAY['#ffffff','#000000','#f48fb1','#81d4fa'], ARRAY['XS','S','M','L','XL'], 50, true,
  'Trendy crop top for western looks. Pair with high-waist jeans or skirts.', true)

ON CONFLICT DO NOTHING;

-- Verify
SELECT COUNT(*) as total_products FROM products;
