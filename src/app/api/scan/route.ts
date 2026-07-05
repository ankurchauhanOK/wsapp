import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) return badRequest("No code provided");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const filters = [`barcode.eq.${code}`, `internal_code.eq.${code}`];
    if (uuidRegex.test(code)) filters.push(`id.eq.${code}`);

    const { data, error } = await supabase()
      .from("products")
      .select("*, category:categories(*)")
      .eq("shop_id", SHOP_ID)
      .eq("active", true)
      .or(filters.join(","))
      .maybeSingle();

    if (error) {
      console.error("[Supabase error]", JSON.stringify(error));
      return NextResponse.json({ success: false, message: "Database query failed" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[API Error]", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
