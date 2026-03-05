import { createClient } from "@supabase/supabase-js";

export async function generatePropertyCode(): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("properties")
    .select("property_code")
    .not("property_code", "is", null)
    .order("property_code", { ascending: false })
    .limit(1)
    .single();

  if (!data?.property_code) return "code0001";

  const match = String(data.property_code).match(/(\d+)$/);
  const n = match ? parseInt(match[1], 10) : 0;
  return "code" + String(n + 1).padStart(4, "0");
}
