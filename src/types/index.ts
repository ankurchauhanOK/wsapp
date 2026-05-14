export type ProductType = "piece" | "weight";

export type UnitType = "piece" | "kg" | "g" | "l" | "ml" | "dozen" | "pack";

export type InventoryReason =
  | "purchase"
  | "sale"
  | "manual_correction"
  | "return"
  | "damage"
  | "stock_in"
  | "stock_out";

export type InventorySource =
  | "billing_scanner"
  | "inventory_scanner"
  | "manual_edit"
  | "online_order";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Shop {
  id: string;
  name: string;
  phone: string;
  address: string;
  upi_id: string;
  upi_qr_image?: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  image?: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  image?: string;
  description?: string;
  type: ProductType;
  unit_type: UnitType;
  price: number;
  stock: number;
  low_stock_threshold: number;
  barcode?: string;
  internal_code?: string;
  sku?: string;
  expiry_date?: string;
  notes?: string;
  active: boolean;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface InventoryTransaction {
  id: string;
  shop_id: string;
  product_id: string;
  quantity_change: number;
  reason: InventoryReason;
  source: InventorySource;
  reference_id?: string;
  notes?: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  shop_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_ref?: string;
  transaction_ref?: string;
  order_type: "online" | "offline";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_type: UnitType;
  price: number;
  total: number;
  product?: Product;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  address?: string;
  favorite_product_ids?: string[];
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  shop_id: string;
  order_id: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transaction_ref?: string;
  proof_image?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  shop_id: string;
  type: "low_stock" | "order" | "expiry" | "info";
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  read: boolean;
  related_id?: string;
  created_at: string;
}

export interface BarcodeLabel {
  id: string;
  shop_id: string;
  product_id: string;
  code: string;
  type: "barcode" | "qr";
  created_at: string;
}

export interface Settings {
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  upi_id: string;
  whatsapp_number: string;
  low_stock_threshold: number;
  currency: string;
  currency_symbol: string;
  order_email_notifications: boolean;
  auto_confirm_payment: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
