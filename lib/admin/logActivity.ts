import { getSupabase } from "@/lib/supabase/client";

export type ActivityAction =
  | "property_created"
  | "property_updated"
  | "property_archived"
  | "property_restored"
  | "property_deleted"
  | "property_duplicated"
  | "property_toggle_publish_1choice"
  | "property_toggle_publish_deals"
  | "property_toggle_private_collection"
  | "property_toggle_featured"
  | "property_toggle_golden_visa"
  | "property_status_changed"
  | "property_image_uploaded"
  | "property_image_removed"
  | "property_cover_changed"
  | "properties_bulk_archived"
  | "properties_bulk_restored"
  | "properties_bulk_deleted"
  | "property_deals_export_opened"
  | "property_deals_export_copied"
  | "private_link_generated"
  | "private_link_regenerated"
  | "private_link_deleted";

/**
 * Insert a row into property_activity_log.
 * Never throws — failures are silently swallowed so they never block the main action.
 *
 * Table columns: property_id, action, actor_email, meta, created_at (DB default)
 * property_code is included in meta when available.
 */
export async function logActivity(
  propertyId: string,
  action: ActivityAction,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("property_activity_log").insert({
      property_id: propertyId,
      action,
      actor_email: user?.email ?? null,
      meta,
    });
    if (error) {
      console.warn("[logActivity] insert failed:", error.message);
    }
  } catch (err) {
    // Log failure must never surface to the user
    console.warn("[logActivity] unexpected error:", err);
  }
}
