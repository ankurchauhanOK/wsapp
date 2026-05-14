import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET() {
  try {
    const [ordersRes, productsRes, itemsRes] = await Promise.all([
      supabase()
        .from("orders")
        .select("*")
        .eq("shop_id", SHOP_ID),
      supabase()
        .from("products")
        .select("id, name")
        .eq("shop_id", SHOP_ID)
        .eq("active", true),
      supabase()
        .from("order_items")
        .select("product_id, product_name, quantity, total")
        .in(
          "order_id",
          (
            await supabase()
              .from("orders")
              .select("id")
              .eq("shop_id", SHOP_ID)
          ).data?.map((o: any) => o.id) || []
        ),
    ]);

    const orders = (ordersRes.data || []) as any[];
    const products = (productsRes.data || []) as any[];
    const items = (itemsRes.data || []) as any[];

    const totalSales = orders.reduce(
      (sum: number, o: any) => sum + (o.total || 0),
      0
    );
    const totalOrders = orders.length;

    // Top products
    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const item of items) {
      if (!productCounts[item.product_id]) {
        productCounts[item.product_id] = {
          name: item.product_name,
          count: 0,
          revenue: 0,
        };
      }
      productCounts[item.product_id].count += item.quantity || 0;
      productCounts[item.product_id].revenue += item.total || 0;
    }

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalOrders,
      totalSales,
      totalProducts: products.length,
      avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      topProducts,
      dailySales: null,
      paymentStats: null,
    });
  } catch (error) {
    return withError(error);
  }
}
