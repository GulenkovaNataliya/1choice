import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

function allowedSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Returns the current user's Supabase ID if they are an admin, otherwise null. */
async function verifyAdmin(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase() ?? "";
    if (!email || !allowedSet().has(email)) return null;
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// PATCH /api/admin/users/[id] — disable or enable user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let action: string;
  try {
    ({ action } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (action !== "disable" && action !== "enable") {
    return NextResponse.json({ error: "action must be 'disable' or 'enable'" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, {
      // 876600h ≈ 100 years — effectively permanent ban
      ban_duration: action === "disable" ? "876600h" : "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — permanently delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorId = await verifyAdmin();
  if (!actorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Guard 1: cannot delete own account
  if (id === actorId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Guard 2: cannot delete the last active admin
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const allowed = allowedSet();
  const activeAdmins = (usersData?.users ?? []).filter((u) => {
    const email = (u.email ?? "").toLowerCase();
    if (!allowed.has(email)) return false;
    const isBanned = u.banned_until ? new Date(u.banned_until) > new Date() : false;
    return !isBanned;
  });
  if (activeAdmins.length <= 1 && activeAdmins.some((u) => u.id === id)) {
    return NextResponse.json(
      { error: "Cannot delete the last active admin account." },
      { status: 400 }
    );
  }

  try {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
