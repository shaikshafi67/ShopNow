-- ═══════════════════════════════════════════════════════════════════════════
--  ShopNow — Seed Products (run AFTER 001_schema.sql)
--  These match the hardcoded products in app/src/data/products.js
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO products (name, price, original_price, rating, reviews, category, gender, tag, images, colors, sizes, stock, try_on_ready, description) VALUES

-- ── Men's T-Shirts ──────────────────────────────────────────────────────────
('NOBERO Oversized Graphic Tee', 849, 1699, 4.3, 1240, 'T-Shirts', 'men', 'Bestseller',
  ARRAY['/images/men/tshirt/tshirt_3_1.jpg','/images/men/tshirt/tshirt_3_2.jpg','/images/men/tshirt/tshirt_3_3.jpg','/images/men/tshirt/tshirt_3_4.jpg','/images/men/tshirt/tshirt_3_5.jpg'],
  ARRAY['#1a1a1a','#8B0000','#1a3a6b'], ARRAY['XS','S','M','L','XL','XXL'], 25, true,
  'Premium oversized fit with bold typography. 100% pure cotton for all-day comfort.'),

('Urban Street Premium Tee', 699, 1299, 4.1, 876, 'T-Shirts', 'men', 'New',
  ARRAY['/images/men/tshirt/tshirt_4_1.jpg','/images/men/tshirt/tshirt_4_2.jpg','/images/men/tshirt/tshirt_4_3.jpg','/images/men/tshirt/tshirt_4_4.jpg','/images/men/tshirt/tshirt_4_5.jpg'],
  ARRAY['#ffffff','#2d2d2d','#4a7c59'], ARRAY['S','M','L','XL'], 25, true,
  'Slim-fit street-style tee with premium cotton blend fabric.'),

('Classic White Essential Tee', 499, 999, 4.4, 2100, 'T-Shirts', 'men', 'Bestseller',
  ARRAY['/images/men/tshirt/tshirt_5_1.jpg','/images/men/tshirt/tshirt_5_2.jpg','/images/men/tshirt/tshirt_5_3.jpg','/images/men/tshirt/tshirt_5_4.jpg','/images/men/tshirt/tshirt_5_5.jpg'],
  ARRAY['#ffffff','#f5f5f5','#e8e8e8'], ARRAY['XS','S','M','L','XL','XXL'], 50, true,
  'The wardrobe essential. Pure white, pure cotton, pure comfort.'),

('Polo Club Premium Tee', 1299, 2499, 4.2, 543, 'T-Shirts', 'men', 'New',
  ARRAY['/images/men/tshirt/tshirt_os_1.jpg','/images/men/tshirt/tshirt_os_2.jpg','/images/men/tshirt/tshirt_os_3.jpg'],
  ARRAY['#1a1a2e','#2d5a27','#8b1a1a'], ARRAY['S','M','L','XL','XXL'], 20, false,
  'Premium polo-style tee with embroidered logo. Perfect for smart-casual looks.'),

('Minimal Logo Drop Tee', 599, 1199, 4.0, 328, 'T-Shirts', 'men', 'New',
  ARRAY['/images/men/tshirt/tshirt_polo_3.jpg','/images/men/tshirt/tshirt_polo_4.jpg'],
  ARRAY['#2c2c2c','#4a6fa5','#2d5016'], ARRAY['S','M','L','XL'], 30, false,
  'Minimalist dropped-shoulder tee. Subtle logo, maximum style.'),

-- ── Men's Shirts ─────────────────────────────────────────────────────────────
('Oxford Check Casual Shirt', 1199, 2299, 4.3, 687, 'Shirts', 'men', 'Trending',
  ARRAY['/images/men/shirt/shirt_1_1.jpg','/images/men/shirt/shirt_1_2.jpg','/images/men/shirt/shirt_1_3.jpg','/images/men/shirt/shirt_1_4.jpg','/images/men/shirt/shirt_1_5.jpg'],
  ARRAY['#c8a97e','#5c7a8c','#2c3e50'], ARRAY['S','M','L','XL','XXL'], 25, false,
  'Classic Oxford weave shirt. Perfect for casual Fridays or weekend outings.'),

('Linen Summer Shirt', 1499, 2799, 4.5, 412, 'Shirts', 'men', 'Bestseller',
  ARRAY['/images/men/shirt/shirt_1_5.jpg','/images/men/shirt/shirt_1_4.jpg','/images/men/shirt/shirt_1_3.jpg'],
  ARRAY['#f0e6d3','#b8d4c8','#d4b896'], ARRAY['S','M','L','XL'], 18, false,
  'Breathable linen blend. The perfect summer companion.'),

('Formal Slim-Fit Shirt', 899, 1799, 4.1, 934, 'Shirts', 'men', 'New',
  ARRAY['/images/men/shirt/shirt_1_2.jpg','/images/men/shirt/shirt_1_1.jpg'],
  ARRAY['#ffffff','#cce5ff','#f8f0e3'], ARRAY['S','M','L','XL','XXL'], 35, false,
  'Slim-fit formal shirt. Wrinkle-resistant fabric for long office days.'),

-- ── Men's Jeans ──────────────────────────────────────────────────────────────
('Slim Fit Dark Wash Jeans', 1599, 2999, 4.4, 1876, 'Jeans', 'men', 'Bestseller',
  ARRAY['/images/men/jeans/jeans_2_4.jpg','/images/men/jeans/jeans_2_3.jpg','/images/men/jeans/jeans_2_2.jpg','/images/men/jeans/jeans_2_1.jpg'],
  ARRAY['#1a1a2e','#2c3e50'], ARRAY['28','30','32','34','36'], 30, false,
  'Slim-fit stretch denim. Dark wash, premium finish.'),

('Relaxed Fit Cargo Jeans', 1899, 3499, 4.2, 654, 'Jeans', 'men', 'Trending',
  ARRAY['/images/men/jeans/jeans_3_4.jpg','/images/men/jeans/jeans_3_3.jpg','/images/men/jeans/jeans_3_2.jpg','/images/men/jeans/jeans_3_1.jpg'],
  ARRAY['#4a3728','#2c3e50','#1a1a2e'], ARRAY['30','32','34','36'], 22, false,
  'Relaxed-fit with cargo pockets. Utility meets style.'),

-- ── Women's Kurtis ────────────────────────────────────────────────────────────
('Floral Print Anarkali Kurti', 899, 1799, 4.6, 2340, 'Kurtis', 'women', 'Bestseller',
  ARRAY['/images/women/kurtis/kurti_1_1.jpg','/images/women/kurtis/kurti_1_2.jpg','/images/women/kurtis/kurti_1_3.jpg','/images/women/kurtis/kurti_1_4.jpg'],
  ARRAY['#c2185b','#7b1fa2','#0277bd'], ARRAY['XS','S','M','L','XL','XXL'], 40, false,
  'Beautiful floral Anarkali with intricate print. Perfect for festive occasions.'),

('Cotton Straight Kurti', 699, 1299, 4.4, 1560, 'Kurtis', 'women', 'New',
  ARRAY['/images/women/kurtis/kurti_2_1.jpg','/images/women/kurtis/kurti_2_2.jpg','/images/women/kurtis/kurti_2_3.jpg'],
  ARRAY['#f48fb1','#80cbc4','#fff176'], ARRAY['S','M','L','XL','XXL'], 35, false,
  'Everyday comfort in pure cotton. Minimal and elegant design.'),

('Embroidered Silk Kurti', 1499, 2999, 4.7, 876, 'Kurtis', 'women', 'Trending',
  ARRAY['/images/women/kurtis/kurti_3_1.jpg','/images/women/kurtis/kurti_3_2.jpg','/images/women/kurtis/kurti_3_3.jpg','/images/women/kurtis/kurti_3_4.jpg'],
  ARRAY['#d4a017','#c2185b','#1a237e'], ARRAY['XS','S','M','L','XL'], 20, false,
  'Luxurious silk with hand-embroidered details. For special occasions.'),

-- ── Women's Sarees ────────────────────────────────────────────────────────────
('Banarasi Silk Saree', 3499, 6999, 4.8, 432, 'Sarees', 'women', 'Premium',
  ARRAY['/images/women/saree/saree_1_3.jpg','/images/women/saree/saree_2_1.jpg','/images/women/saree/saree_2_3.jpg'],
  ARRAY['#8b0000','#1a237e','#1b5e20'], ARRAY['Free Size'], 10, false,
  'Authentic Banarasi silk with zari work. A timeless classic.'),

('Chiffon Printed Saree', 1299, 2499, 4.5, 789, 'Sarees', 'women', 'Trending',
  ARRAY['/images/women/saree/saree_3_1.jpg','/images/women/saree/saree_3_3.jpg','/images/women/saree/saree_3_4.jpg'],
  ARRAY['#f48fb1','#80deea','#dce775'], ARRAY['Free Size'], 25, false,
  'Lightweight chiffon with beautiful prints. Perfect for all occasions.'),

-- ── Women's Short Kurtis ──────────────────────────────────────────────────────
('Casual Short Kurti', 599, 1199, 4.3, 1230, 'Short Kurtis', 'women', 'New',
  ARRAY['/images/women/shortkurtis/sk1_1.jpg','/images/women/shortkurtis/sk1_2.jpg','/images/women/shortkurtis/sk1_3.jpg','/images/women/shortkurtis/sk1_4.jpg','/images/women/shortkurtis/sk1_5.jpg'],
  ARRAY['#f06292','#64b5f6','#81c784'], ARRAY['XS','S','M','L','XL','XXL'], 45, false,
  'Casual short kurti for everyday wear. Pair with jeans or leggings.'),

('Rayon Printed Short Kurti', 799, 1499, 4.4, 876, 'Short Kurtis', 'women', 'Bestseller',
  ARRAY['/images/women/shortkurtis/sk2_1.jpg','/images/women/shortkurtis/sk2_2.jpg','/images/women/shortkurtis/sk2_3.jpg','/images/women/shortkurtis/sk2_4.jpg'],
  ARRAY['#ff8a65','#a5d6a7','#90caf9'], ARRAY['S','M','L','XL','XXL'], 38, false,
  'Soft rayon with vibrant prints. Effortlessly chic.'),

-- ── Women's Nightwear ─────────────────────────────────────────────────────────
('Satin Night Suit Set', 1099, 1999, 4.6, 543, 'Nightwear', 'women', 'Bestseller',
  ARRAY['/images/women/nightwear/nw1_1.jpg','/images/women/nightwear/nw1_2.jpg','/images/women/nightwear/nw1_3.jpg','/images/women/nightwear/nw1_4.jpg'],
  ARRAY['#f8bbd0','#e1bee7','#b2dfdb'], ARRAY['S','M','L','XL','XXL'], 30, false,
  'Luxuriously soft satin night suit. Sleep in style.'),

('Cotton Printed Pyjama Set', 799, 1499, 4.5, 765, 'Nightwear', 'women', 'New',
  ARRAY['/images/women/nightwear/nw1_5.jpg','/images/women/nightwear/nw1_6.jpg','/images/women/nightwear/nw1_7.jpg'],
  ARRAY['#ffccbc','#dcedc8','#e1f5fe'], ARRAY['S','M','L','XL','XXL'], 35, false,
  'Breathable cotton pyjama set with fun prints. Perfect for all seasons.'),

-- ── Women's Bottomwear ────────────────────────────────────────────────────────
('Palazzo Wide-Leg Pants', 699, 1299, 4.3, 678, 'Bottom Wear', 'women', 'Trending',
  ARRAY['/images/women/bottomwear/bw2_1.jpg','/images/women/bottomwear/bw3_1.jpg','/images/women/bottomwear/bw3_2.jpg'],
  ARRAY['#000000','#6d4c41','#37474f'], ARRAY['XS','S','M','L','XL','XXL'], 40, false,
  'Flowy palazzo pants for ultimate comfort. Dress up or down effortlessly.'),

-- ── Women's Tops ──────────────────────────────────────────────────────────────
('Crop Top Western Wear', 599, 1099, 4.4, 1123, 'Tops', 'women', 'Trending',
  ARRAY['/images/women/tops/top_2_1.jpg'],
  ARRAY['#ffffff','#000000','#f48fb1','#81d4fa'], ARRAY['XS','S','M','L','XL'], 50, true,
  'Trendy crop top for western looks. Pair with high-waist jeans or skirts.')

ON CONFLICT DO NOTHING;
