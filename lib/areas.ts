/**
 * Shared areas helper — reads from the `locations` table.
 * Server-side only. Never imported directly by client components
 * (client components import only `import type { Area }` for the shape).
 */

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

// ── Public type ───────────────────────────────────────────────────────────────

export type Area = {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  is_active: boolean;
};

// ── Fetch all areas (admin pages) ─────────────────────────────────────────────

export async function fetchAreas(): Promise<Area[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select("id,name,slug,group_name,is_active")
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[fetchAreas] error:", error.message);
    return [];
  }
  return (data ?? []) as Area[];
}

// ── Fetch only active areas (public pages / filter) ───────────────────────────

export async function fetchActiveAreas(): Promise<Area[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select("id,name,slug,group_name,is_active")
    .eq("is_active", true)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[fetchActiveAreas] error:", error.message);
    return [];
  }
  return (data ?? []) as Area[];
}
