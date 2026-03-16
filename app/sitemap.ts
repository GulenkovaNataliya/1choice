import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOCATION_SLUGS } from "@/lib/locations/locationSeoConfig";

const BASE_URL = "https://1choice.gr";

// ── Static public pages ───────────────────────────────────────────────────────
// Excluded intentionally:
//   /private          — gated, requires code
//   /saved            — user-specific, robots: noindex
//   /compare          — user-specific, robots: noindex
//   /admin/*          — protected, never public
//   /1choicedeals     — catalogue variant, covered by /properties canonical
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,                           changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/properties`,                 changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/golden-visa-greece`,         changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/investment-ownership-guide`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/about`,                      changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/contact`,                    changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/legal`,                      changeFrequency: "monthly", priority: 0.4 },
];

// ── Location SEO pages ────────────────────────────────────────────────────────
// Source of truth: lib/locations/locationSeoConfig.ts → LOCATION_SLUGS
// Adding a new entry to that config automatically includes it here.
const LOCATION_PAGES: MetadataRoute.Sitemap = LOCATION_SLUGS.map((slug) => ({
  url: `${BASE_URL}/properties/location/${slug}`,
  changeFrequency: "weekly" as const,
  priority: 0.8,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [...STATIC_PAGES, ...LOCATION_PAGES];
  }

  const supabase = await createSupabaseServerClient();

  // ── Property detail pages ─────────────────────────────────────────────────
  // Only public, published, non-private properties.
  // Filtered catalogue URLs (/properties?location=…) are NOT included —
  // canonical for those is the plain /properties page.
  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "published")
    .eq("publish_1choice", true)
    .or("private_collection.is.null,private_collection.eq.false")
    .not("slug", "is", null);

  const propertyEntries: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${BASE_URL}/properties/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...STATIC_PAGES, ...LOCATION_PAGES, ...propertyEntries];
}
