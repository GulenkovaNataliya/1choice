import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSettings } from "@/lib/settings/fetchSettings";
import UsersManager, { type AdminUser } from "@/components/admin/UsersManager";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = {
  title: "Settings | Admin",
};

export default async function AdminSettingsPage() {
  // ── Fetch settings ────────────────────────────────────────────────────────
  const settings = await fetchSettings();

  // ── Current user ID (for self-delete protection in UsersManager) ─────────
  const supabase = await createSupabaseServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id ?? null;

  // ── Fetch admin users ────────────────────────────────────────────────────
  const allowedEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  let users: AdminUser[] = [];
  let fetchError: string | null = null;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    const authUsers = data.users ?? [];
    const seenEmails = new Set<string>();

    for (const u of authUsers) {
      const email = (u.email ?? "").toLowerCase();
      if (!allowedEmails.has(email)) continue;
      seenEmails.add(email);
      const isBanned = u.banned_until ? new Date(u.banned_until) > new Date() : false;
      users.push({
        id: u.id,
        email: u.email ?? email,
        created_at: u.created_at,
        status: isBanned ? "disabled" : "active",
      });
    }

    for (const email of allowedEmails) {
      if (!seenEmails.has(email)) {
        users.push({ id: null, email, created_at: null, status: "pending" });
      }
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Settings</h1>
      </div>

      <div className="flex flex-col gap-6">

        {/* Site Settings — now editable */}
        <SettingsForm initialValues={settings} />

        {/* Users */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
          <UsersManager initialUsers={users} fetchError={fetchError} currentUserId={currentUserId} />
        </div>

      </div>
    </div>
  );
}
