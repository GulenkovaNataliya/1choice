import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // 1. DB connection
    const { error: dbError } = await admin.from("properties").select("id").limit(1);

    // 2. Published public properties
    const { data: publicProps, error: publicError } = await admin
      .from("properties")
      .select("id")
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .limit(5);

    // 3. Private collection check
    const { data: privateProps } = await admin
      .from("properties")
      .select("id")
      .eq("private_collection", true)
      .limit(1);

    // 4. Leads table check
    const { error: leadsError } = await admin.from("leads").select("id").limit(1);

    return NextResponse.json({
      status: "ok",
      checks: {
        db:                  !dbError,
        publicProperties:    !publicError,
        hasPublicProperties: (publicProps?.length ?? 0) > 0,
        hasPrivateCollection:(privateProps?.length ?? 0) > 0,
        leadsTable:          !leadsError,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: (e as Error).message },
      { status: 500 }
    );
  }
}
