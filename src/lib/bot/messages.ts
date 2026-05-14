export function getStoreUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export function getWelcomeMessage(): string {
  const storeUrl = getStoreUrl();
  return (
    `Welcome 👋\n\n` +
    `Browse our grocery store here:\n` +
    `${storeUrl}/store\n\n` +
    `Order groceries online easily 📦`
  );
}

export function getHelpMessage(): string {
  const storeUrl = getStoreUrl();
  return (
    `Here's how to order:\n\n` +
    `1️⃣ Tap the store link below\n` +
    `2️⃣ Browse products by category\n` +
    `3️⃣ Add items to your cart\n` +
    `4️⃣ Checkout and pay via UPI\n\n` +
    `🛒 ${storeUrl}/store\n\n` +
    `Reply "status" to check your order status.`
  );
}

export function getOrderStatusPlaceholder(): string {
  return (
    `To check your order status, please provide your order ID.\n\n` +
    `You can find it in your order confirmation message.\n\n` +
    `Order tracking will be available in a future update.`
  );
}
