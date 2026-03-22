import { getSupabase } from "@/lib/supabase/client";

export async function getPropertyByToken(token: string) {
  const supabase = getSupabase();

  // Step 1 — find token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("property_access_tokens")
    .select("property_id")
    .eq("token", token)
    .single();

  if (tokenError || !tokenRow) return null;

  // Step 2 — load property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", tokenRow.property_id)
    .single();

  if (propertyError || !property) return null;

  return property;
}
