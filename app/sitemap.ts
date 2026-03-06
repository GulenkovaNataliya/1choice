import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://1choice.gr";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,                           changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/properties`,                 changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/golden-visa-greece`,         changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/investment-ownership-guide`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/about`,                      changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/contact`,                    changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return STATIC_PAGES;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "published")
    .eq("publish_1choice", true)
    .eq("vip", false)
    .not("slug", "is", null);

  const propertyEntries: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${BASE_URL}/properties/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...STATIC_PAGES, ...propertyEntries];
}
