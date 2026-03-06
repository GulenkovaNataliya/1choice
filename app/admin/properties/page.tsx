import Link from "next/link";
import PropertiesTable, { type AdminProperty } from "@/components/admin/PropertiesTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Properties | Admin",
};

export default async function AdminPropertiesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,status,publish_1choice,publish_deals,vip,featured,is_golden_visa,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/properties] fetch error:", error);
  }

  const rows: AdminProperty[] = (properties ?? []) as AdminProperty[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Properties</h1>
        <Link
          href="/admin/properties/new"
          className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded hover:bg-[#333333] transition-colors"
        >
          New Property
        </Link>
      </div>
      <PropertiesTable rows={rows} />
    </div>
  );
}
