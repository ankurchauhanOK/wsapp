import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withError, notFound } from "@/lib/api-utils";

const supabase = () => createAdminClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from("alerts")
      .update({ read: true })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return notFound("Alert");
    return NextResponse.json({ success: true });
  } catch (error) {
    return withError(error);
  }
}
