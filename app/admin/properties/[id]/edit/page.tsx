import { notFound } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";
import PrivateLinkManager from "@/components/admin/PrivateLinkManager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { fetchActiveAreas } from "@/lib/areas";

export const metadata = {
  title: "Edit Property | Admin",
};

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  const [{ data: property, error }, areas] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id,property_code,title,slug,category,subtype,transaction_type,price_eur,location,location_text,summary,description,size_sqm,bedrooms,bathrooms,floor,year_built,year_renovated,building_condition,energy_class,fireplace,elevator,security_door,alarm_system,video_doorphone,smart_home,satellite_tv,internet_ready,storage,sea_view,mountain_view,garden,pool,frames_type,double_glazing,triple_glazing,mosquito_screens,thermal_insulation,sound_insulation,flooring_type,living_rooms,kitchens,storage_rooms,wc,cover_image_url,gallery_image_urls,youtube_video_url,virtual_tour_url,latitude,longitude,approximate_location,is_golden_visa,featured,vip,private_collection,publish_1choice,publish_deals,status,agent_notes"
      )
      .eq("id", params.id)
      .single(),
    fetchActiveAreas(),
  ]);

  if (error || !property) notFound();

  // Fetch current private link token server-side to avoid loading flash
  let initialToken: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: tokenRow } = await admin
      .from("property_access_tokens")
      .select("token")
      .eq("property_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    initialToken = tokenRow?.token ?? null;
  } catch {
    // Best-effort — if token fetch fails, PrivateLinkManager will show empty state
  }

  const initialValues = {
    title: property.title ?? "",
    slug: property.slug ?? "",
    price_eur: property.price_eur != null ? String(property.price_eur) : "",
    location_slug: (property as { location?: string | null }).location ?? "",
    location_text: property.location_text ?? "",
    summary: property.summary ?? "",
    description: property.description ?? "",
    size_sqm: property.size_sqm != null ? String(property.size_sqm) : "",
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    floor: property.floor != null ? String(property.floor) : "",
    year_built: property.year_built != null ? String(property.year_built) : "",
    year_renovated: property.year_renovated != null ? String(property.year_renovated) : "",
    building_condition: property.building_condition ?? "",
    energy_class: property.energy_class ?? "",
    fireplace: property.fireplace ?? false,
    elevator: property.elevator ?? false,
    security_door: property.security_door ?? false,
    alarm_system: property.alarm_system ?? false,
    video_doorphone: property.video_doorphone ?? false,
    smart_home: property.smart_home ?? false,
    satellite_tv: property.satellite_tv ?? false,
    internet_ready: property.internet_ready ?? false,
    storage: property.storage ?? false,
    sea_view: property.sea_view ?? false,
    mountain_view: property.mountain_view ?? false,
    garden: property.garden ?? false,
    pool: property.pool ?? false,
    frames_type: property.frames_type ?? "",
    double_glazing: property.double_glazing ?? false,
    triple_glazing: property.triple_glazing ?? false,
    mosquito_screens: property.mosquito_screens ?? false,
    thermal_insulation: property.thermal_insulation ?? false,
    sound_insulation: property.sound_insulation ?? false,
    flooring_type: property.flooring_type ?? "",
    living_rooms: property.living_rooms != null ? String(property.living_rooms) : "",
    kitchens: property.kitchens != null ? String(property.kitchens) : "",
    storage_rooms: property.storage_rooms != null ? String(property.storage_rooms) : "",
    wc: property.wc != null ? String(property.wc) : "",
    cover_image_url: property.cover_image_url ?? "",
    gallery_image_urls: (property.gallery_image_urls as string[] | null) ?? [],
    is_golden_visa: property.is_golden_visa ?? false,
    featured: property.featured ?? false,
    publish_1choice: property.publish_1choice ?? true,
    publish_deals: property.publish_deals ?? false,
    status: (property.status ?? "draft") as "draft" | "published" | "archived",
    latitude: property.latitude != null ? String(property.latitude) : "",
    longitude: property.longitude != null ? String(property.longitude) : "",
    approximate_location: property.approximate_location ?? false,
    category: property.category ?? "",
    subtype: property.subtype ?? "",
    transaction_type: property.transaction_type ?? "sale",
    youtube_video_url: property.youtube_video_url ?? "",
    virtual_tour_url: property.virtual_tour_url ?? "",
    agent_notes: property.agent_notes ?? "",
    private_collection: property.private_collection ?? false,
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
        areas={areas}
      />

      {/* Private link management — shown below the form, only for Private Collection */}
      <div className="mt-5">
        <PrivateLinkManager
          propertyId={property.id}
          propertyCode={property.property_code ?? null}
          isPrivateCollection={property.private_collection === true || property.vip === true}
          initialToken={initialToken}
        />
      </div>
    </div>
  );
}
