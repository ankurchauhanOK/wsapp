import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  let code = "";
  try {
    const { searchParams } = new URL(req.url);
    code = searchParams.get("code") || "";
    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const filters = [`barcode.eq.${code}`, `internal_code.eq.${code}`];
    if (uuidRegex.test(code)) filters.push(`id.eq.${code}`);

    const { data, error } = await supabase()
      .from("products")
      .select("*, category:categories(*)")
      .eq("shop_id", SHOP_ID)
      .eq("active", true)
      .or(filters.join(","))
      .limit(1);

    if (error) {
      console.error("[Supabase error]", error.message, error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 },
      );
    }

    const product = data?.[0];

    if (product) {
      console.log(`[Scan] Found locally: ${product.name} (${code})`);
      return NextResponse.json({ type: "product", product });
    }

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
          console.log(`[Scan] Found on OpenFoodFacts: ${offProduct.name} (${code})`);
        }
      }
    } catch (offErr) {
      console.error("[Scan] OpenFoodFacts fetch failed:", offErr);
    }

    if (offProduct) {
      return NextResponse.json({ openfoodfacts: offProduct }, { status: 404 });
    }

    console.log(`[Scan] Not found anywhere: ${code}`);
    return NextResponse.json({ barcode: code }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(`[Scan] Unhandled error for code="${code}":`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
