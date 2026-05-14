export const SHOP_NAME = "Kiranax Store";
export const SHOP_PHONE = "+919999999999";
export const SHOP_ADDRESS = "123, Main Road, City Center";
export const UPI_ID = "shop@upi";
export const WHATSAPP_NUMBER = "917017846105";

export const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

export const CATEGORY_ICONS: Record<string, string> = {
  vegetables: "🥬",
  fruits: "🍎",
  dairy: "🥛",
  bakery: "🍞",
  beverages: "🥤",
  snacks: "🍿",
  spices: "🌶️",
  rice: "🍚",
  oil: "🫒",
  personal_care: "🧴",
  household: "🧹",
  other: "📦",
};

export const SAMPLE_CATEGORIES = [
  { name: "Vegetables", icon: "🥬" },
  { name: "Fruits", icon: "🍎" },
  { name: "Dairy & Eggs", icon: "🥛" },
  { name: "Bakery", icon: "🍞" },
  { name: "Beverages", icon: "🥤" },
  { name: "Snacks", icon: "🍿" },
  { name: "Spices", icon: "🌶️" },
  { name: "Rice & Grains", icon: "🍚" },
  { name: "Oils & Ghee", icon: "🫒" },
  { name: "Personal Care", icon: "🧴" },
  { name: "Household", icon: "🧹" },
  { name: "Other", icon: "📦" },
];

export const SAMPLE_PRODUCTS = [
  { name: "Fresh Tomatoes", category: "Vegetables", type: "weight" as const, unit_type: "kg" as const, price: 40, stock: 50, low_stock_threshold: 5, image: "" },
  { name: "Potatoes", category: "Vegetables", type: "weight" as const, unit_type: "kg" as const, price: 30, stock: 100, low_stock_threshold: 10, image: "" },
  { name: "Onions", category: "Vegetables", type: "weight" as const, unit_type: "kg" as const, price: 35, stock: 80, low_stock_threshold: 10, image: "" },
  { name: "Banana", category: "Fruits", type: "piece" as const, unit_type: "piece" as const, price: 6, stock: 200, low_stock_threshold: 20, image: "" },
  { name: "Apple", category: "Fruits", type: "weight" as const, unit_type: "kg" as const, price: 120, stock: 30, low_stock_threshold: 5, image: "" },
  { name: "Milk (Full Cream)", category: "Dairy & Eggs", type: "piece" as const, unit_type: "pack" as const, price: 56, stock: 40, low_stock_threshold: 10, image: "" },
  { name: "Eggs (12 pcs)", category: "Dairy & Eggs", type: "piece" as const, unit_type: "dozen" as const, price: 72, stock: 30, low_stock_threshold: 5, image: "" },
  { name: "Fresh Bread", category: "Bakery", type: "piece" as const, unit_type: "pack" as const, price: 35, stock: 20, low_stock_threshold: 5, image: "" },
  { name: "Biscuits (Parle-G)", category: "Snacks", type: "piece" as const, unit_type: "pack" as const, price: 10, stock: 100, low_stock_threshold: 20, image: "" },
  { name: "Coca-Cola (2L)", category: "Beverages", type: "piece" as const, unit_type: "piece" as const, price: 85, stock: 25, low_stock_threshold: 5, image: "" },
  { name: "Basmati Rice (1kg)", category: "Rice & Grains", type: "piece" as const, unit_type: "pack" as const, price: 120, stock: 40, low_stock_threshold: 5, image: "" },
  { name: "Turmeric Powder", category: "Spices", type: "piece" as const, unit_type: "pack" as const, price: 24, stock: 50, low_stock_threshold: 10, image: "" },
  { name: "Mustard Oil (1L)", category: "Oils & Ghee", type: "piece" as const, unit_type: "piece" as const, price: 180, stock: 20, low_stock_threshold: 5, image: "" },
  { name: "Wheat Flour (5kg)", category: "Rice & Grains", type: "piece" as const, unit_type: "pack" as const, price: 175, stock: 15, low_stock_threshold: 3, image: "" },
  { name: "Sugar (1kg)", category: "Spices", type: "piece" as const, unit_type: "pack" as const, price: 42, stock: 60, low_stock_threshold: 10, image: "" },
  { name: "Tea (Tata Chai)", category: "Beverages", type: "piece" as const, unit_type: "pack" as const, price: 95, stock: 25, low_stock_threshold: 5, image: "" },
  { name: "Soap (Dove)", category: "Personal Care", type: "piece" as const, unit_type: "piece" as const, price: 45, stock: 30, low_stock_threshold: 10, image: "" },
  { name: "Detergent Surf (1kg)", category: "Household", type: "piece" as const, unit_type: "pack" as const, price: 130, stock: 15, low_stock_threshold: 5, image: "" },
  { name: "Cooking Soda", category: "Other", type: "piece" as const, unit_type: "pack" as const, price: 15, stock: 40, low_stock_threshold: 10, image: "" },
  { name: "Pasta (1kg)", category: "Snacks", type: "piece" as const, unit_type: "pack" as const, price: 85, stock: 20, low_stock_threshold: 5, image: "" },
];
