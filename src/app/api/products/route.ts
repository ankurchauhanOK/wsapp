import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError, badRequest } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const ids = searchParams.get("ids");
    const includeOos = searchParams.get("include_oos") === "true";

    let query = supabase()
      .from("products")
      .select("*, category:categories(*)")
      .eq("shop_id", SHOP_ID)
      .eq("active", true)
      .order("name");

    if (category) query = query.eq("category_id", category);
    if (search) query = query.ilike("name", `%${search}%`);
    if (ids) {
      const idArr = ids.split(",");
      query = query.in("id", idArr);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let products = data || [];

    if (!includeOos && !search && !ids) {
      products = products.filter((p: any) => (p.stock ?? 0) > 0);
    }

    if (!ids) {
      products.sort((a: any, b: any) => {
        const aStock = (a.stock ?? 0) > 0 ? ((a.stock ?? 0) > (a.low_stock_threshold ?? 0) ? 2 : 1) : 0;
        const bStock = (b.stock ?? 0) > 0 ? ((b.stock ?? 0) > (b.low_stock_threshold ?? 0) ? 2 : 1) : 0;
        return bStock - aStock;
      });
    }

    return NextResponse.json(products);
  } catch (error) {
    return withError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.price) {
      return badRequest("Product name and price are required");
    }
    const { data, error } = await supabase()
      .from("products")
      .insert({ ...body, shop_id: SHOP_ID })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return withError(error);
  }
}
