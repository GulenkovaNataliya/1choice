import { getSupabase } from "@/lib/supabase/client";

type Action = "create" | "update" | "archive" | "restore" | "delete" | "duplicate";

/**
 * Insert a row into property_activity_log.
 * Never throws — failures are silently swallowed so they never block the main action.
 */
export async function logActivity(
  propertyId: string,
  action: Action,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("property_activity_log").insert({
      property_id: propertyId,
      action,
      actor_email: user?.email ?? null,
      meta,
    });
  } catch {
    // Log failure must never surface to the user
  }
}
