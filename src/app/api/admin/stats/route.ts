import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Fetch independently so one failure doesn't crash everything
    let orders: any[] = [];
    let allProducts: any[] = [];
    let transactions: any[] = [];

    try {
      const { data } = await supabase()
        .from("orders")
        .select("*")
        .eq("shop_id", SHOP_ID)
        .gte("created_at", today.toISOString());
      orders = data || [];
    } catch (e) {
      console.error("Orders query failed:", e);
    }

    try {
      const { data } = await supabase()
        .from("products")
        .select("*")
        .eq("shop_id", SHOP_ID)
        .eq("active", true);
      allProducts = data || [];
    } catch (e) {
      console.error("Products query failed:", e);
    }

    try {
      const { data } = await supabase()
        .from("inventory_transactions")
        .select("*") // simplified select to avoid relation issues
        .eq("shop_id", SHOP_ID)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
      transactions = data || [];
    } catch (e) {
      console.error("Transactions query failed:", e);
    }

    const lowStockProducts = allProducts.filter(
      (p: any) => p.stock > 0 && p.stock <= p.low_stock_threshold
    );
    const outOfStockProducts = allProducts.filter(
      (p: any) => p.stock <= 0
    );
    const expiringProducts = allProducts.filter((p: any) => {
      if (!p.expiry_date) return false;
      const days = Math.ceil(
        (new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return days <= 7 && days >= 0;
    });

    return NextResponse.json({
      todayOrders: orders.length,
      todaySales: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringCount: expiringProducts.length,
      totalProducts: allProducts.length,
      pendingOrders: orders.filter((o: any) => o.status === "pending").length,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentMovements: transactions.slice(0, 5),
    });
  } catch (error) {
    return withError(error);
  }
}
