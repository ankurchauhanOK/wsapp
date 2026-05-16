import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const productId = searchParams.get("product_id");

    let query = supabase()
      .from("inventory_transactions")
      .select("*, product:products(*)")
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (productId) query = query.eq("product_id", productId);

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
    const { data, error } = await supabase()
      .from("inventory_transactions")
      .insert({ ...body, shop_id: SHOP_ID })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return withError(error);
  }
}
