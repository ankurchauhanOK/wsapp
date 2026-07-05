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
      return NextResponse.json(
        { success: false, message: "Database query failed", openfoodfacts: null },
        { status: 500 },
      );
    }

    if (data) return NextResponse.json(data);

    let offProduct = null;
    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          offProduct = {
            name: p.product_name || p.product_name_en || "",
            barcode: code,
            image_url: p.image_url || undefined,
            category: p.categories || undefined,
            brands: p.brands || undefined,
          };
        }
      }
    } catch (offErr) {
      console.error("[OpenFoodFacts error]", offErr);
    }

    return NextResponse.json(
      { success: false, message: "Product not found", openfoodfacts: offProduct },
      { status: 404 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[API Error]", message);
    return NextResponse.json(
      { success: false, message, openfoodfacts: null },
      { status: 500 },
    );
  }
}
