import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError, badRequest } from "@/lib/api-utils";

const supabase = () => createAdminClient();
const SHOP_ID = process.env.SHOP_ID || "default";

export async function GET() {
  try {
    const { data: categories, error: catError } = await supabase()
      .from("categories")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("sort_order");

    if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });

    // Try to fetch subcategories, but don't fail if table doesn't exist
    let subcategories: any[] = [];
    try {
      const { data: subs } = await supabase()
        .from("subcategories")
        .select("*")
        .eq("shop_id", SHOP_ID)
        .order("sort_order");
      if (subs) subcategories = subs;
    } catch {
      // subcategories table may not exist
    }

    // Attach subcategories to categories
    const categoriesWithSubs = (categories || []).map((cat: any) => ({
      ...cat,
      subcategories: subcategories.filter((sub: any) => sub.category_id === cat.id),
    }));

    return NextResponse.json(categoriesWithSubs);
  } catch (error) {
    return withError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) return badRequest("Category name is required");
    const { data, error } = await supabase()
      .from("categories")
      .insert({ ...body, shop_id: SHOP_ID })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return withError(error);
  }
}
