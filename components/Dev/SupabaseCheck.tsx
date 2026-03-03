"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";

/** Temporary health check — remove before production. */
export default function SupabaseCheck() {
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data, error }) => {
      console.log("[Supabase] session:", data.session, error ?? "");
    });
  }, []);

  return null;
}
