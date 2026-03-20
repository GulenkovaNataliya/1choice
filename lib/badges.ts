import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Badge = {
  id: string;
  name: string;
};

export async function fetchBadges(): Promise<Badge[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("custom_badges")
      .select("id,name")
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}
