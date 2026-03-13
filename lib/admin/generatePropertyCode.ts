import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generatePropertyCode(): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("properties")
    .select("property_code")
    .not("property_code", "is", null)
    .order("property_code", { ascending: false })
    .limit(1)
    .single();

  const MIN = 1030;

  if (!data?.property_code) return "code" + String(MIN + 1).padStart(4, "0");

  const match = String(data.property_code).match(/(\d+)$/);
  const n = match ? parseInt(match[1], 10) : 0;
  return "code" + String(Math.max(n, MIN) + 1).padStart(4, "0");
}
