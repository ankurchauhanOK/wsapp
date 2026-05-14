import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError, badRequest, notFound } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) return badRequest("No code provided");

    const { data, error } = await supabase()
      .from("products")
      .select("*, category:categories(*)")
      .eq("shop_id", SHOP_ID)
      .eq("active", true)
      .or(`barcode.eq.${code},internal_code.eq.${code},id.eq.${code}`)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return notFound("Product");

    return NextResponse.json(data);
  } catch (error) {
    return withError(error);
  }
}
