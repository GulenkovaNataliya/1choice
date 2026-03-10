import PropertyForm from "@/components/admin/PropertyForm";
import { generatePropertyCode } from "@/lib/admin/generatePropertyCode";
import { fetchActiveAreas } from "@/lib/areas";

export const metadata = {
  title: "New Property | Admin",
};

export default async function NewPropertyPage() {
  const [propertyCode, areas] = await Promise.all([
    generatePropertyCode(),
    fetchActiveAreas(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">New Property</h1>
      </div>
      <PropertyForm propertyCode={propertyCode} areas={areas} />
    </div>
  );
}
