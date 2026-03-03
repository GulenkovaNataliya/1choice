import { getSupabase } from "@/lib/supabase/client";

export function publicImageUrl(path: string, bucket = "property-images") {
  const supabase = getSupabase();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
