import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE_URL = "https://1choice.gr";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,                           changeFrequency: "weekly",  priority: 1.0 },
  { url: `${BASE_URL}/properties`,                 changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/golden-visa-greece`,         changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/investment-ownership-guide`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/about`,                      changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/contact`,                    changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/legal`,                      changeFrequency: "monthly", priority: 0.4 },
  { url: `${BASE_URL}/private`,                    changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return STATIC_PAGES;
  }

  const supabase = await createSupabaseServerClient();

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
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...STATIC_PAGES, ...propertyEntries];
}
