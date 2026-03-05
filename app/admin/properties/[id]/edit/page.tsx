import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";

export const metadata = {
  title: "Edit Property | Admin",
};

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location_text,summary,description,size_sqm,bedrooms,bathrooms,floor,cover_image_url,gallery_image_urls,is_golden_visa,featured,vip,publish_1choice,publish_deals,status"
    )
    .eq("id", params.id)
    .single();

  if (error || !property) notFound();

  const initialValues = {
    title: property.title ?? "",
    slug: property.slug ?? "",
    price_eur: property.price_eur != null ? String(property.price_eur) : "",
    location_text: property.location_text ?? "",
    summary: property.summary ?? "",
    description: property.description ?? "",
    size_sqm: property.size_sqm != null ? String(property.size_sqm) : "",
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    floor: property.floor != null ? String(property.floor) : "",
    cover_image_url: property.cover_image_url ?? "",
    gallery_image_urls: (property.gallery_image_urls as string[] | null) ?? [],
    is_golden_visa: property.is_golden_visa ?? false,
    featured: property.featured ?? false,
    vip: property.vip ?? false,
    publish_1choice: property.publish_1choice ?? true,
    publish_deals: property.publish_deals ?? false,
    status: (property.status ?? "draft") as "draft" | "published" | "archived",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Edit Property</h1>
        <p className="text-sm text-[#888888] mt-1">{property.property_code}</p>
      </div>
      <PropertyForm
        mode="edit"
        propertyId={property.id}
        propertyCode={property.property_code ?? ""}
        initialValues={initialValues}
      />
    </div>
  );
}
