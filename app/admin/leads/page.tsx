import { createSupabaseServerClient } from "@/lib/supabase/server";
import LeadsManager, { type Lead } from "@/components/admin/LeadsManager";

export const metadata = {
  title: "Leads | Admin",
};

export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id,created_at,name,email,phone,source,page_url,property_id,summary,chat_log,status,internal_note,properties(title,property_code)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Leads</h1>
      </div>

      {error ? (
        <div className="bg-white border border-red-200 rounded-lg px-6 py-8 text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">Failed to load leads</p>
          <p className="text-xs text-[#888888]">{error.message}</p>
        </div>
      ) : (
        <LeadsManager initialRows={(leads ?? []) as unknown as Lead[]} />
      )}
    </div>
  );
}
