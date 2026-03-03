import { getSupabase } from "@/lib/supabase/client";

export type PropertyRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
  location: string; // slug
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  featured: boolean | null;
  created_at: string;
  cover_image_path: string | null;
};

type FetchArgs = {
  location?: string | null; // slug
};

export async function fetchProperties(args: FetchArgs = {}): Promise<PropertyRow[]> {
  const supabase = getSupabase();

  let q = supabase
    .from("properties")
    .select(
      "id,title,slug,price,location,bedrooms,bathrooms,size,featured,created_at,cover_image_path"
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
