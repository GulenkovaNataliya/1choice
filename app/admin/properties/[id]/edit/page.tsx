import { notFound } from "next/navigation";
import PropertyForm, { type LevelDetail } from "@/components/admin/PropertyForm";
import PrivateLinkManager from "@/components/admin/PrivateLinkManager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { fetchActiveAreas } from "@/lib/areas";
import { fetchBadges } from "@/lib/badges";

export const metadata = {
  title: "Edit Property | Admin",
};

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: property, error }, areas, badges] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id,property_code,title,slug,category,subtype,transaction_type,price_eur,location,location_text,summary,description,size_sqm,bedrooms,bathrooms,floor,year_built,year_renovated,building_condition,energy_class,heating_type,custom_heating,cooling_type,custom_cooling,heating_system,heating_fuel,heating_features,cooling_system,fireplace,elevator,security_door,alarm_system,video_doorphone,smart_home,satellite_tv,internet_ready,wardrobe_room,sea_view,mountain_view,balcony,veranda,awnings,garden,pool,parking,parking_spaces,parking_type,parking_level,parking_area_sqm,parking_suitable_for,parking_features,jacuzzi,close_to_beaches,panoramic_view,acropolis_view,private_roof_terrace,loft,internal_staircase,barbeque,home_cinema,smoke_detection,total_property_area_sqm,total_building_floors,number_of_levels,level_details,frames_type,double_glazing,triple_glazing,mosquito_screens,thermal_insulation,sound_insulation,flooring_type,living_rooms,kitchens,storage_rooms,wc,furnished,custom_furnished,cover_image_url,gallery_image_urls,youtube_video_url,virtual_tour_url,latitude,longitude,approximate_location,address,show_address,is_golden_visa,featured,private_collection,publish_1choice,publish_deals,status,agent_notes,custom_badge,custom_badge_color"
      )
      .eq("id", id)
      .single(),
    fetchActiveAreas(),
    fetchBadges(),
  ]);

  if (error || !property) notFound();

  // Fetch current private link token server-side to avoid loading flash
  let initialToken: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: tokenRow } = await admin
      .from("property_access_tokens")
      .select("token")
      .eq("property_id", id)
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
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    floor: property.floor != null ? String(property.floor) : "",
    // Prefer total_property_area_sqm; fall back to legacy size_sqm for old rows that only had that field
    total_property_area_sqm: (() => {
      const n = (property as { total_property_area_sqm?: number | null }).total_property_area_sqm;
      if (n != null) return String(n);
      return property.size_sqm != null ? String(property.size_sqm) : "";
    })(),
    total_building_floors: (property as { total_building_floors?: number | null }).total_building_floors != null ? String((property as { total_building_floors?: number | null }).total_building_floors) : "",
    number_of_levels: (() => {
      const n = (property as { number_of_levels?: number | null }).number_of_levels;
      return n != null ? String(n) : "1";
    })(),
    levels: (() => {
      const stored = (property as { level_details?: LevelDetail[] | null }).level_details;
      if (stored && stored.length > 0) return stored;
      // Backward compat: build Level 1 from legacy flat fields
      return [{
        level_size_sqm: "",
        is_maisonette: false,
        bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
        wc: property.wc != null ? String(property.wc) : "",
        kitchens: property.kitchens != null ? String(property.kitchens) : "",
        living_rooms: property.living_rooms != null ? String(property.living_rooms) : "",
        hall: "",
        storage_rooms: property.storage_rooms != null ? String(property.storage_rooms) : "",
        // Prefill from global DB fields so legacy properties are not visually empty
        wardrobe_room:        (property as { wardrobe_room?: boolean | null }).wardrobe_room ?? false,
        balcony:              (property as { balcony?: boolean | null }).balcony ?? false,
        veranda:              (property as { veranda?: boolean | null }).veranda ?? false,
        awnings:              (property as { awnings?: boolean | null }).awnings ?? false,
        private_roof_terrace: (property as { private_roof_terrace?: boolean | null }).private_roof_terrace ?? false,
        loft:                 (property as { loft?: boolean | null }).loft ?? false,
        internal_staircase:   (property as { internal_staircase?: boolean | null }).internal_staircase ?? false,
        internal_elevator:    false, // no global DB equivalent
        fireplace:            property.fireplace ?? false,
        jacuzzi:              (property as { jacuzzi?: boolean | null }).jacuzzi ?? false,
        home_cinema:          (property as { home_cinema?: boolean | null }).home_cinema ?? false,
      } satisfies LevelDetail];
    })(),
    year_built: property.year_built != null ? String(property.year_built) : "",
    year_renovated: property.year_renovated != null ? String(property.year_renovated) : "",
    building_condition: property.building_condition ?? "",
    energy_class: property.energy_class ?? "",
    heating_type: (property as { heating_type?: string | null }).heating_type ?? "",
    custom_heating: (property as { custom_heating?: string | null }).custom_heating ?? "",
    cooling_type: (property as { cooling_type?: string | null }).cooling_type ?? "",
    custom_cooling: (property as { custom_cooling?: string | null }).custom_cooling ?? "",
    // New structured fields — load from DB when present; safe fallback from legacy heating_type/cooling_type
    heating_system: (() => {
      const n = (property as { heating_system?: string | null }).heating_system;
      if (n) return n;
      const leg = (property as { heating_type?: string | null }).heating_type;
      if (leg === "central" || leg === "autonomous" || leg === "none") return leg;
      return "";
    })(),
    heating_fuel: (() => {
      const n = (property as { heating_fuel?: string | null }).heating_fuel;
      if (n) return n;
      const leg = (property as { heating_type?: string | null }).heating_type;
      if (leg === "oil" || leg === "natural_gas" || leg === "electric") return leg;
      return "";
    })(),
    heating_features: (() => {
      const n = (property as { heating_features?: string[] | null }).heating_features;
      if (n && n.length > 0) return n;
      const leg = (property as { heating_type?: string | null }).heating_type;
      if (leg === "heat_pump") return ["heat_pump"];
      if (leg === "air_conditioning") return ["air_conditioning"];
      if (leg === "underfloor") return ["underfloor"];
      return [];
    })(),
    cooling_system: (() => {
      const n = (property as { cooling_system?: string | null }).cooling_system;
      if (n) return n;
      const leg = (property as { cooling_type?: string | null }).cooling_type;
      if (leg === "central_ac" || leg === "split_units" || leg === "none") return leg;
      return "";
    })(),
    fireplace: property.fireplace ?? false,
    elevator: property.elevator ?? false,
    security_door: property.security_door ?? false,
    alarm_system: property.alarm_system ?? false,
    video_doorphone: property.video_doorphone ?? false,
    smart_home: property.smart_home ?? false,
    satellite_tv: property.satellite_tv ?? false,
    internet_ready: property.internet_ready ?? false,
    wardrobe_room: (property as { wardrobe_room?: boolean | null }).wardrobe_room ?? false,
    sea_view: property.sea_view ?? false,
    mountain_view: property.mountain_view ?? false,
    balcony: (property as { balcony?: boolean | null }).balcony ?? false,
    veranda: (property as { veranda?: boolean | null }).veranda ?? false,
    awnings: (property as { awnings?: boolean | null }).awnings ?? false,
    garden: property.garden ?? false,
    pool: property.pool ?? false,
    parking: (property as { parking?: boolean | null }).parking ?? false,
    parking_spaces: (property as { parking_spaces?: number | null }).parking_spaces != null ? String((property as { parking_spaces?: number | null }).parking_spaces) : "",
    parking_type: (property as { parking_type?: string | null }).parking_type ?? "",
    parking_level: (property as { parking_level?: string | null }).parking_level ?? "",
    parking_area_sqm: (property as { parking_area_sqm?: number | null }).parking_area_sqm != null ? String((property as { parking_area_sqm?: number | null }).parking_area_sqm) : "",
    parking_suitable_for: (property as { parking_suitable_for?: string[] | null }).parking_suitable_for ?? [],
    parking_features: (property as { parking_features?: string[] | null }).parking_features ?? [],
    jacuzzi: (property as { jacuzzi?: boolean | null }).jacuzzi ?? false,
    close_to_beaches: (property as { close_to_beaches?: boolean | null }).close_to_beaches ?? false,
    panoramic_view: (property as { panoramic_view?: boolean | null }).panoramic_view ?? false,
    acropolis_view: (property as { acropolis_view?: boolean | null }).acropolis_view ?? false,
    private_roof_terrace: (property as { private_roof_terrace?: boolean | null }).private_roof_terrace ?? false,
    loft: (property as { loft?: boolean | null }).loft ?? false,
    internal_staircase: (property as { internal_staircase?: boolean | null }).internal_staircase ?? false,
    barbeque: (property as { barbeque?: boolean | null }).barbeque ?? false,
    home_cinema: (property as { home_cinema?: boolean | null }).home_cinema ?? false,
    smoke_detection: (property as { smoke_detection?: boolean | null }).smoke_detection ?? false,
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
    furnished: (property as { furnished?: string | null }).furnished ?? "",
    custom_furnished: (property as { custom_furnished?: string | null }).custom_furnished ?? "",
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
    address: (property as { address?: string | null }).address ?? "",
    show_address: (property as { show_address?: boolean | null }).show_address ?? false,
    category: property.category ?? "",
    subtype: property.subtype ?? "",
    transaction_type: property.transaction_type ?? "sale",
    youtube_video_url: property.youtube_video_url ?? "",
    virtual_tour_url: property.virtual_tour_url ?? "",
    agent_notes: property.agent_notes ?? "",
    private_collection: property.private_collection ?? false,
    custom_badge: (property as { custom_badge?: string | null }).custom_badge ?? "",
    custom_badge_color: (property as { custom_badge_color?: string | null }).custom_badge_color ?? "red",
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
        badges={badges}
      />

      {/* Private link management — shown below the form, only for Private Collection */}
      <div className="mt-5">
        <PrivateLinkManager
          propertyId={property.id}
          propertyCode={property.property_code ?? null}
          isPrivateCollection={property.private_collection === true}
          initialToken={initialToken}
        />
      </div>
    </div>
  );
}
