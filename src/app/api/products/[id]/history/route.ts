import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const limit = Math.min(
      Number(new URL(req.url).searchParams.get("limit")) || 50,
      200
    );

    const { data, error } = await supabase()
      .from("inventory_transactions")
      .select("*")
      .eq("product_id", id)
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error) {
    return withError(error);
  }
}
