import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import UsersManager, { type AdminUser } from "@/components/admin/UsersManager";

export const metadata = {
  title: "Settings | Admin",
};

const FUTURE_SECTIONS = [
  { title: "Company Info",      description: "Business name, registration number, address." },
  { title: "Contact Details",   description: "Phone, email, office hours." },
  { title: "Branding / Assets", description: "Logo, favicon, brand colours." },
  { title: "Integrations",      description: "Chat widget, analytics, third-party services." },
];

export default async function AdminSettingsPage() {
  // Build the allowlist from the environment variable
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

    // Users that exist in both ADMIN_EMAILS and Supabase Auth
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

    // Emails in ADMIN_EMAILS that have no Supabase account yet — show as Pending
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

        {/* Users — working section */}
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
          <UsersManager initialUsers={users} fetchError={fetchError} />
        </div>

        {/* Future sections — placeholders */}
        {FUTURE_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white border border-[#E8E8E8] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-[#1E1E1E] mb-1">{section.title}</h2>
            <p className="text-xs text-[#AAAAAA] mb-4">{section.description}</p>
            <p className="text-sm text-[#BBBBBB]">To be configured.</p>
          </div>
        ))}

      </div>
    </div>
  );
}
