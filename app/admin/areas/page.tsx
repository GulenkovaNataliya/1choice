import { fetchAreas } from "@/lib/areas";
import AreasManager from "@/components/admin/AreasManager";

export const metadata = {
  title: "Areas | Admin",
};

export default async function AdminAreasPage() {
  const areas = await fetchAreas();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Areas</h1>
        <p className="text-sm text-[#888888] mt-2">
          Manage location taxonomy. Active areas appear in the public filter and property form.
        </p>
      </div>
      <AreasManager areas={areas} />
    </div>
  );
}
