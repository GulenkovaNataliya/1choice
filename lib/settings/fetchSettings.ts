import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SiteSettings = {
  company_name: string | null;
  registration_number: string | null;
  company_address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  office_hours: string | null;
  logo_url: string | null;
};

export const SETTINGS_FALLBACK: SiteSettings = {
  company_name: "1Choice Real Estate",
  registration_number: null,
  company_address: "Athens, Greece",
  contact_phone: null,
  contact_email: "contact@1choice.gr",
  office_hours: null,
  logo_url: null,
};

export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("site_settings")
      .select(
        "company_name,registration_number,company_address,contact_phone,contact_email,office_hours,logo_url"
      )
      .eq("id", 1)
      .single();

    if (!data) return SETTINGS_FALLBACK;

    return {
      company_name:        data.company_name        || SETTINGS_FALLBACK.company_name,
      registration_number: data.registration_number || null,
      company_address:     data.company_address     || SETTINGS_FALLBACK.company_address,
      contact_phone:       data.contact_phone       || null,
      contact_email:       data.contact_email       || SETTINGS_FALLBACK.contact_email,
      office_hours:        data.office_hours        || null,
      logo_url:            data.logo_url            || null,
    };
  } catch {
    return SETTINGS_FALLBACK;
  }
}
