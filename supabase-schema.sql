-- ============================================================
-- Kiranax Database Schema
-- Run this entire file in the Supabase SQL Editor in one shot.
-- Table order: dependencies first, dependents after.
-- Seed data included at the bottom.
-- ============================================================

-- 1. Categories (no FK dependencies)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  image TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Customers (no FK dependencies)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  favorite_product_ids JSONB DEFAULT '[]',
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, phone)
);

-- 3. Products (references categories)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('piece', 'weight')),
  unit_type TEXT NOT NULL DEFAULT 'piece',
  price NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  barcode TEXT,
  internal_code TEXT,
  sku TEXT,
  expiry_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Orders (references customers)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_method TEXT NOT NULL DEFAULT 'upi',
  payment_ref TEXT,
  transaction_ref TEXT,
  order_type TEXT NOT NULL DEFAULT 'online' CHECK (order_type IN ('online', 'offline')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Order items (references orders, products)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL DEFAULT 'piece',
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- 6. Inventory transactions (references products)
CREATE TABLE inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change NUMERIC NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'sale', 'manual_correction', 'return', 'damage', 'stock_in', 'stock_out')),
  source TEXT NOT NULL CHECK (source IN ('billing_scanner', 'inventory_scanner', 'manual_edit', 'online_order')),
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Payment records (references orders)
CREATE TABLE payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'upi',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  transaction_ref TEXT,
  proof_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Alerts (no FK dependencies)
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL DEFAULT 'default',
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'order', 'expiry', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  read BOOLEAN NOT NULL DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_internal_code ON products(internal_code);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_customers_shop ON customers(shop_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_alerts_shop ON alerts(shop_id);
CREATE INDEX idx_alerts_read ON alerts(read);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Stock decrement helper function
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  current_stock NUMERIC;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = product_id;
  RETURN GREATEST(0, current_stock - qty);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Seed data (categories + sample products)
-- ============================================================
DO $$
DECLARE
  veg_id UUID;
  fruit_id UUID;
  dairy_id UUID;
  bakery_id UUID;
  bev_id UUID;
  snack_id UUID;
  spice_id UUID;
  rice_id UUID;
  oil_id UUID;
  care_id UUID;
  house_id UUID;
  other_id UUID;
BEGIN
  -- Categories
  INSERT INTO categories (shop_id, name, sort_order) VALUES
    ('default', 'Vegetables', 1),
    ('default', 'Fruits', 2),
    ('default', 'Dairy & Eggs', 3),
    ('default', 'Bakery', 4),
    ('default', 'Beverages', 5),
    ('default', 'Snacks', 6),
    ('default', 'Spices', 7),
    ('default', 'Rice & Grains', 8),
    ('default', 'Oils & Ghee', 9),
    ('default', 'Personal Care', 10),
    ('default', 'Household', 11),
    ('default', 'Other', 12);

  -- Fetch generated UUIDs for each category
  SELECT id INTO veg_id FROM categories WHERE name = 'Vegetables' AND shop_id = 'default';
  SELECT id INTO fruit_id FROM categories WHERE name = 'Fruits' AND shop_id = 'default';
  SELECT id INTO dairy_id FROM categories WHERE name = 'Dairy & Eggs' AND shop_id = 'default';
  SELECT id INTO bakery_id FROM categories WHERE name = 'Bakery' AND shop_id = 'default';
  SELECT id INTO bev_id FROM categories WHERE name = 'Beverages' AND shop_id = 'default';
  SELECT id INTO snack_id FROM categories WHERE name = 'Snacks' AND shop_id = 'default';
  SELECT id INTO spice_id FROM categories WHERE name = 'Spices' AND shop_id = 'default';
  SELECT id INTO rice_id FROM categories WHERE name = 'Rice & Grains' AND shop_id = 'default';
  SELECT id INTO oil_id FROM categories WHERE name = 'Oils & Ghee' AND shop_id = 'default';
  SELECT id INTO care_id FROM categories WHERE name = 'Personal Care' AND shop_id = 'default';
  SELECT id INTO house_id FROM categories WHERE name = 'Household' AND shop_id = 'default';
  SELECT id INTO other_id FROM categories WHERE name = 'Other' AND shop_id = 'default';

  -- Products
  INSERT INTO products (shop_id, category_id, name, type, unit_type, price, stock, low_stock_threshold, internal_code) VALUES
    ('default', veg_id, 'Fresh Tomatoes', 'weight', 'kg', 40, 50, 5, 'WSTOM01'),
    ('default', veg_id, 'Potatoes', 'weight', 'kg', 30, 100, 10, 'WSPOT01'),
    ('default', veg_id, 'Onions', 'weight', 'kg', 35, 80, 10, 'WSONI01'),
    ('default', fruit_id, 'Banana', 'piece', 'piece', 6, 200, 20, 'WSBAN01'),
    ('default', fruit_id, 'Apple', 'weight', 'kg', 120, 30, 5, 'WSAPP01'),
    ('default', dairy_id, 'Milk (Full Cream)', 'piece', 'pack', 56, 40, 10, 'WSMIL01'),
    ('default', dairy_id, 'Eggs (12 pcs)', 'piece', 'dozen', 72, 30, 5, 'WSEGG01'),
    ('default', bakery_id, 'Fresh Bread', 'piece', 'pack', 35, 20, 5, 'WSBRD01'),
    ('default', snack_id, 'Biscuits (Parle-G)', 'piece', 'pack', 10, 100, 20, 'WSBIS01'),
    ('default', bev_id, 'Coca-Cola (2L)', 'piece', 'piece', 85, 25, 5, 'WSCOL01'),
    ('default', rice_id, 'Basmati Rice (1kg)', 'piece', 'pack', 120, 40, 5, 'WSRIC01'),
    ('default', spice_id, 'Turmeric Powder', 'piece', 'pack', 24, 50, 10, 'WSTUR01'),
    ('default', oil_id, 'Mustard Oil (1L)', 'piece', 'piece', 180, 20, 5, 'WSOIL01'),
    ('default', rice_id, 'Wheat Flour (5kg)', 'piece', 'pack', 175, 15, 3, 'WSFLR01'),
    ('default', spice_id, 'Sugar (1kg)', 'piece', 'pack', 42, 60, 10, 'WSSGR01'),
    ('default', bev_id, 'Tea (Tata Chai)', 'piece', 'pack', 95, 25, 5, 'WSTEA01'),
    ('default', care_id, 'Soap (Dove)', 'piece', 'piece', 45, 30, 10, 'WSSOP01'),
    ('default', house_id, 'Detergent Surf (1kg)', 'piece', 'pack', 130, 15, 5, 'WSDET01'),
    ('default', other_id, 'Cooking Soda', 'piece', 'pack', 15, 40, 10, 'WSSOD01'),
    ('default', snack_id, 'Pasta (1kg)', 'piece', 'pack', 85, 20, 5, 'WSPAS01');
END $$;
