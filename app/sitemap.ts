import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://1choice.gr";

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/properties`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/1choicedeals`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/golden-visa-greece`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/investment-ownership-guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/private`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/legal`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return staticUrls;

  const supabase = createClient(url, key);

  const { data } = await supabase
    .from("properties")
    .select("slug, created_at")
    .order("created_at", { ascending: false });

  const propertyUrls: MetadataRoute.Sitemap =
    (data ?? []).map((p) => ({
      url: `${baseUrl}/properties/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticUrls, ...propertyUrls];
}
