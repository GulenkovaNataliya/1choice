import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

/*
 * Token table used: property_access_tokens
 *
 * Columns:
 *   id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY
 *   token       text        NOT NULL UNIQUE
 *   property_id uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE
 *   created_at  timestamptz DEFAULT now()
 */

async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase() ?? "";
    const allowed = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    );
    return !!email && allowed.has(email);
  } catch {
    return false;
  }
}

// GET /api/admin/properties/[id]/private-link — fetch current token (if any)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from("property_access_tokens")
    .select("token, created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ token: data?.token ?? null });
}

// POST /api/admin/properties/[id]/private-link — generate (or regenerate) token
// Rule: delete any existing token for this property, insert fresh one.
// Old link becomes invalid immediately.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  // Delete existing tokens for this property
  await admin.from("property_access_tokens").delete().eq("property_id", id);

  // Generate cryptographically secure UUID token
  const token = crypto.randomUUID();

  const { error } = await admin.from("property_access_tokens").insert({
    token,
    property_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}

// DELETE /api/admin/properties/[id]/private-link — remove token; old link stops working
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("property_access_tokens")
    .delete()
    .eq("property_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
