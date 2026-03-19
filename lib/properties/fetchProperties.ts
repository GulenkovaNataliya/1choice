import { getSupabase } from "@/lib/supabase/client";

export type PropertyRow = {
  id: string;
  property_code: string | null;
  title: string;
  slug: string;
  price_eur: number | null;
  location: string;
  location_text: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  year_built: number | null;
  featured: boolean | null;
  private_collection: boolean | null;
  is_golden_visa: boolean | null;
  publish_deals: boolean | null;
  sea_view: boolean | null;
  pool: boolean | null;
  elevator: boolean | null;
  transaction_type: string | null;
  subtype: string | null;
  created_at: string;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
};

type FetchArgs = {
  location?: string | null; // slug
};

export async function fetchProperties(args: FetchArgs = {}): Promise<PropertyRow[]> {
  const supabase = getSupabase();

  let q = supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location,location_text,bedrooms,bathrooms,size_sqm,floor,year_built,featured,private_collection,is_golden_visa,publish_deals,sea_view,pool,elevator,transaction_type,created_at,cover_image_url,gallery_image_urls"
    )
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (args.location) {
    q = q.eq("location", args.location);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[properties] fetch error:", error);
    return [];
  }

  return (data ?? []) as PropertyRow[];
}
