import { Suspense } from "react";
import type { Metadata } from "next";
import PropertiesClient from "./PropertiesClient";
import type { PropertyRow } from "@/lib/properties/fetchProperties";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchActiveAreas } from "@/lib/areas";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; page?: string }>;
}): Promise<Metadata> {
  const { location, page: pageParam } = await searchParams;

  const p = new URLSearchParams();
  if (location) p.set("location", location);

  const page = Number(pageParam ?? "1");
  if (page > 1) p.set("page", String(page));

  const query = p.toString();
  const canonical = query ? `/properties?${query}` : "/properties";

  return {
    title: "Properties for Sale in Greece | 1Choice",
    description:
      "Curated properties for sale in Greece. Apartments, villas, investment opportunities and Golden Visa eligible real estate.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Properties for Sale in Greece | 1Choice",
      description:
        "Curated properties for sale in Greece. Apartments, villas and investment real estate in Greece.",
      url: "https://1choice.gr/properties",
      siteName: "1Choice",
      type: "website",
    },
  };
}

const PAGE_SIZE = 12;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; page?: string }>;
}) {
  const { location, page: pageParam } = await searchParams;

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();
  const areas = await fetchActiveAreas();

  let q = supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location,location_text,bedrooms,bathrooms,size_sqm,floor,year_built,featured,private_collection,is_golden_visa,publish_deals,sea_view,pool,elevator,created_at,cover_image_url,gallery_image_urls",
      { count: "exact" }
    )
    .neq("private_collection", true) // exclude private inventory
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (location) q = q.eq("location", location);

  const { data, count } = await q;
  const properties = (data ?? []) as PropertyRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <Suspense>
      <PropertiesClient
        initialProperties={properties}
        currentPage={page}
        totalPages={totalPages}
        total={total}
        hasNext={hasNext}
        hasPrev={hasPrev}
        areas={areas}
      />
    </Suspense>
  );
}
