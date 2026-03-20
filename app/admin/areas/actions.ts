"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { revalidatePath } from "next/cache";

export async function createArea(name: string, slug: string, group_name: string) {
  if (!name.trim() || !slug.trim() || !group_name.trim()) {
    return { error: "Name, slug, and group are required" };
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("locations").insert({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    group_name: group_name.trim(),
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function updateArea(id: string, name: string, slug: string, group_name: string) {
  if (!name.trim() || !slug.trim() || !group_name.trim()) {
    return { error: "Name, slug, and group are required" };
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("locations")
    .update({ name: name.trim(), slug: slug.trim().toLowerCase(), group_name: group_name.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function toggleAreaActive(id: string, currentlyActive: boolean) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("locations")
    .update({ is_active: !currentlyActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function deleteArea(id: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("locations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/areas");
  return { success: true };
}

// Quick-create used by PropertyForm modal — returns the created row so the
// client can add it to its local list without a full page reload.
export async function createAreaQuick(
  name: string,
  slug: string,
  group_name: string,
): Promise<{ id: string; name: string; slug: string; group_name: string; is_active: boolean } | { error: string }> {
  if (!name.trim() || !slug.trim() || !group_name.trim()) {
    return { error: "Name, slug, and group are required." };
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("locations")
    .insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      group_name: group_name.trim(),
      is_active: true,
    })
    .select("id,name,slug,group_name,is_active")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/areas");
  return data as { id: string; name: string; slug: string; group_name: string; is_active: boolean };
}
