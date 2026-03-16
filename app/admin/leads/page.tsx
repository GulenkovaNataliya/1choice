import { createSupabaseServerClient } from "@/lib/supabase/server";
import LeadsManager, { type Lead } from "@/components/admin/LeadsManager";

export const metadata = {
  title: "Leads | Admin",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const selectedId = typeof params.id === "string" ? params.id : null;

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id,created_at,lead_type,name,email,phone,source,page_url,property_id,property_code,property_title,property_slug,property_location,entry_intent,intent,notes,summary,full_chat,status,internal_note"
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
        <LeadsManager
          initialRows={(leads ?? []) as unknown as Lead[]}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}
