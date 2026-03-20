"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Badge } from "@/lib/badges";

function sanitizeName(raw: string): string {
  // collapse whitespace, remove emoji / non-BMP characters
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .trim();
}

export async function createBadgeQuick(
  rawName: string
): Promise<Badge | { error: string }> {
  const name = sanitizeName(rawName);

  if (!name) return { error: "Badge name is required." };
  if (name.length > 22) return { error: "Badge name must be 22 characters or fewer." };

  const supabase = await createSupabaseServerClient();

  // Case-insensitive duplicate check
  const { data: existing } = await supabase
    .from("custom_badges")
    .select("id,name")
    .ilike("name", name)
    .limit(1)
    .single();

  if (existing) {
    return { error: `Badge "${existing.name}" already exists.` };
  }

  const { data, error } = await supabase
    .from("custom_badges")
    .insert({ name })
    .select("id,name")
    .single();

  if (error || !data) {
    return { error: "Failed to create badge. Please try again." };
  }

  revalidatePath("/admin/properties");
  return data as Badge;
}
