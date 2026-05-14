import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [ordersRes, productsRes] = await Promise.all([
      supabase()
        .from("orders")
        .select("*")
        .eq("shop_id", SHOP_ID)
        .gte("created_at", today.toISOString()),
      supabase()
        .from("products")
        .select("*")
        .eq("shop_id", SHOP_ID)
        .eq("active", true),
    ]);

    const orders = (ordersRes.data || []) as any[];
    const allProducts = (productsRes.data || []) as any[];

    const lowStockProducts = allProducts.filter(
      (p: any) => p.stock <= p.low_stock_threshold
    );

    return NextResponse.json({
      todayOrders: orders.length,
      todaySales: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      lowStockCount: lowStockProducts.length,
      totalProducts: allProducts.length,
      pendingOrders: orders.filter((o: any) => o.status === "pending").length,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5),
    });
  } catch (error) {
    return withError(error);
  }
}
