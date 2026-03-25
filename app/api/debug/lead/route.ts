import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

// ── Dev/staging only — inserts a real row into leads ─────────────────────────
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from("leads").insert({
      name:   "TEST QA",
      phone:  "+306900000000",
      source: "qa_test",
      status: "new",
    });

    return NextResponse.json({ success: !error, error: error ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
