import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError, badRequest } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    let query = supabase()
      .from("orders")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (phone) query = query.eq("customer_phone", phone);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error) {
    return withError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customer_name || !body.customer_phone) {
      return badRequest("Customer name and phone are required");
    }

    if (!body.items?.length) {
      return badRequest("Order must have at least one item");
    }

    const { data: order, error: orderError } = await supabase()
      .from("orders")
      .insert({
        shop_id: SHOP_ID,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address || "",
        total: body.total,
        status: "pending",
        payment_status: "pending",
        payment_method: "upi",
        order_type: body.order_type || "online",
      })
      .select()
      .single();

    if (orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 });

    const items = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_type: item.unit_type,
      price: item.price,
      total: item.total,
    }));

    const { error: itemsError } = await supabase()
      .from("order_items")
      .insert(items);

    if (itemsError) {
      await supabase().from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Deduct stock
    for (const item of body.items) {
      const { data: product } = await supabase()
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      const currentStock = product?.stock ?? 0;
      const newStock = Math.max(0, currentStock - item.quantity);

      await supabase()
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id);
    }

    // Record inventory transactions
    const txs = body.items.map((item: any) => ({
      shop_id: SHOP_ID,
      product_id: item.product_id,
      quantity_change: -item.quantity,
      reason: "sale",
      source: "online_order",
      reference_id: order.id,
    }));
    await supabase().from("inventory_transactions").insert(txs);

    // Check low stock alerts
    for (const item of body.items) {
      const { data: product } = await supabase()
        .from("products")
        .select("name, stock, low_stock_threshold")
        .eq("id", item.product_id)
        .single();

      if (product && product.stock <= product.low_stock_threshold) {
        await supabase().from("alerts").insert({
          shop_id: SHOP_ID,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.name} is running low (${product.stock} left)`,
          severity: product.stock <= 0 ? "high" : "medium",
          related_id: item.product_id,
        });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    return withError(error);
  }
}
