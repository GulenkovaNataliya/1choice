"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";

/** Temporary health check — remove before production. */
export default function SupabaseCheck() {
  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      console.warn("[Supabase] client not initialized — env vars missing?");
      return;
    }
    client.auth.getSession().then(({ data, error }) => {
      console.log("[Supabase] session:", data.session, error ?? "");
    });
  }, []);

  return null;
}
