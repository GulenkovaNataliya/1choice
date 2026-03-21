import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Admin",
};

async function fetchCounts() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalProperties },
    { count: publishedProperties },
    { count: draftProperties },
    { count: archivedProperties },
    { count: totalLeads },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalProperties:     totalProperties     ?? 0,
    publishedProperties: publishedProperties ?? 0,
    draftProperties:     draftProperties     ?? 0,
    archivedProperties:  archivedProperties  ?? 0,
    totalLeads:          totalLeads          ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const counts = await fetchCounts();

  const cards = [
    { label: "Total Properties",     value: counts.totalProperties },
    { label: "Published",            value: counts.publishedProperties },
    { label: "Draft",                value: counts.draftProperties },
    { label: "Archived",             value: counts.archivedProperties },
    { label: "Total Leads",          value: counts.totalLeads },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-[#E8E8E8] rounded-xl px-6 py-5"
          >
            <p className="text-xs text-[#888888] font-medium uppercase tracking-widest mb-2">
              {label}
            </p>
            <p className="text-3xl font-bold text-[#1E1E1E]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
