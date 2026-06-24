-- ==========================================================
-- V2: Seed Data for TruzCart
-- ==========================================================

-- Roles
INSERT INTO roles (name, description) VALUES
  ('ROLE_ADMIN', 'Administrator with full access'),
  ('ROLE_CUSTOMER', 'Regular customer')
ON CONFLICT (name) DO NOTHING;

-- Admin User (password: Admin@123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, enabled, email_verified)
VALUES ('admin@truzcart.com', '$2a$12$LJ4v3h0Xw1L5bO3X8J9YKeC5aN6rQwFpUvH3PqGcN7X0OhvKjZV9W', 'Admin', 'TruzCart', '+919999900000', true, true)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@truzcart.com' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

-- Demo Customer (password: Customer@123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, enabled, email_verified)
VALUES ('customer@truzcart.com', '$2a$12$LJ4v3h0Xw1L5bO3X8J9YKeC5aN6rQwFpUvH3PqGcN7X0OhvKjZV9W', 'John', 'Doe', '+919999911111', true, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'customer@truzcart.com' AND r.name = 'ROLE_CUSTOMER'
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (name, slug, description, display_order, active) VALUES
  ('Groceries', 'groceries', 'Fresh groceries and daily essentials', 1, true),
  ('Clothing', 'clothing', 'Trendy fashion and apparel', 2, true),
  ('Accessories', 'accessories', 'Watches, bags, and fashion accessories', 3, true),
  ('Electronics', 'electronics', 'Smartphones, laptops, and gadgets', 4, true),
  ('Household', 'household', 'Home and kitchen essentials', 5, true),
  ('Health & Beauty', 'health-beauty', 'Personal care and wellness products', 6, true)
ON CONFLICT DO NOTHING;

-- Products — Groceries
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Organic Basmati Rice 5kg', 'organic-basmati-rice-5kg', 'Premium aged basmati rice sourced from the foothills of the Himalayas. Long grain, aromatic, and perfect for biryanis.', 'Premium aged long-grain basmati rice', 'GRO-001', 549.00, 699.00, 320.00, 150, 20, c.id, 'India Gate', true, true
FROM categories c WHERE c.slug = 'groceries';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Cold Pressed Coconut Oil 1L', 'cold-pressed-coconut-oil-1l', 'Pure virgin cold-pressed coconut oil. Chemical-free, suitable for cooking and skincare.', '100% pure virgin coconut oil', 'GRO-002', 379.00, 449.00, 220.00, 200, 15, c.id, 'KLF Nirmal', true, false
FROM categories c WHERE c.slug = 'groceries';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Tata Tea Gold 500g', 'tata-tea-gold-500g', 'Premium blend of Assam tea with rich taste and aroma. Strong and refreshing.', 'Premium Assam tea blend', 'GRO-003', 275.00, 310.00, 160.00, 300, 25, c.id, 'Tata', true, true
FROM categories c WHERE c.slug = 'groceries';

-- Products — Electronics
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Wireless Bluetooth Earbuds Pro', 'wireless-bluetooth-earbuds-pro', 'Active Noise Cancellation, 30-hour battery, IPX5 waterproof, premium sound quality with deep bass.', 'ANC earbuds with 30hr battery', 'ELC-001', 2499.00, 3999.00, 1200.00, 75, 10, c.id, 'boAt', true, true
FROM categories c WHERE c.slug = 'electronics';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Smart Watch Ultra Fitness', 'smart-watch-ultra-fitness', '1.8" AMOLED display, SpO2 monitoring, 100+ sports modes, 7-day battery life, Bluetooth calling.', 'AMOLED fitness smartwatch', 'ELC-002', 3999.00, 5999.00, 2400.00, 45, 8, c.id, 'Noise', true, true
FROM categories c WHERE c.slug = 'electronics';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'USB-C 65W Fast Charger', 'usb-c-65w-fast-charger', 'GaN technology, supports PD 3.0, compatible with MacBook, iPhone, Samsung. Compact travel design.', '65W GaN charger with USB-C', 'ELC-003', 1299.00, 1999.00, 700.00, 120, 15, c.id, 'Anker', true, false
FROM categories c WHERE c.slug = 'electronics';

-- Products — Clothing
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Slim Fit Cotton Casual Shirt', 'slim-fit-cotton-casual-shirt', 'Premium 100% cotton, breathable fabric, available in multiple colors. Perfect for office and casual wear.', '100% cotton slim fit shirt', 'CLT-001', 999.00, 1499.00, 450.00, 60, 10, c.id, 'Allen Solly', true, true
FROM categories c WHERE c.slug = 'clothing';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Women Ethnic Kurta Set', 'women-ethnic-kurta-set', 'Designer printed kurta with palazzo pants. Rayon fabric, comfortable fit, available in S/M/L/XL.', 'Designer printed kurta with palazzo', 'CLT-002', 1299.00, 1899.00, 650.00, 40, 8, c.id, 'W', true, true
FROM categories c WHERE c.slug = 'clothing';

-- Products — Accessories
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Classic Leather Belt', 'classic-leather-belt', 'Genuine leather belt with auto-lock buckle. Adjustable size fits 28-42 inches.', 'Genuine leather auto-lock belt', 'ACC-001', 599.00, 899.00, 280.00, 90, 12, c.id, 'Wildcraft', true, false
FROM categories c WHERE c.slug = 'accessories';

-- Products — Household
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Stainless Steel Water Bottle 1L', 'stainless-steel-water-bottle-1l', 'Double-wall vacuum insulated, keeps drinks hot for 12hrs and cold for 24hrs. BPA-free, leak-proof.', 'Vacuum insulated steel bottle', 'HOU-001', 699.00, 999.00, 380.00, 100, 15, c.id, 'Milton', true, true
FROM categories c WHERE c.slug = 'household';

INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold, category_id, brand, is_active, is_featured)
SELECT 'Bamboo Cutting Board Set', 'bamboo-cutting-board-set', 'Set of 3 organic bamboo cutting boards in different sizes. Anti-bacterial, eco-friendly, and durable.', 'Set of 3 organic bamboo boards', 'HOU-002', 849.00, 1199.00, 480.00, 55, 10, c.id, 'Pigeon', true, false
FROM categories c WHERE c.slug = 'household';

-- Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count, active)
VALUES
  ('WELCOME10', 'Welcome discount — 10% off your first order', 'PERCENTAGE', 10.00, 200.00, 500.00, NOW(), NOW() + INTERVAL '1 year', 1000, 0, true),
  ('FLAT100', 'Flat ₹100 off on orders above ₹999', 'FIXED', 100.00, 999.00, 100.00, NOW(), NOW() + INTERVAL '6 months', 500, 0, true),
  ('SUMMER25', 'Summer sale — 25% off', 'PERCENTAGE', 25.00, 500.00, 1000.00, NOW(), NOW() + INTERVAL '3 months', 200, 0, true)
ON CONFLICT DO NOTHING;

-- Customer Address
INSERT INTO addresses (user_id, label, full_name, phone, street, city, state, zip_code, country, is_default)
SELECT u.id, 'Home', 'John Doe', '+919999911111', '42 MG Road, Bangalore Urban', 'Bangalore', 'Karnataka', '560001', 'India', true
FROM users u WHERE u.email = 'customer@truzcart.com'
ON CONFLICT DO NOTHING;
