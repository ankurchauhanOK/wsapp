import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

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
