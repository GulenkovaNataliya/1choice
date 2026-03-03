import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PropertiesClient from "./PropertiesClient";
import type { PropertyRow } from "@/lib/properties/fetchProperties";

export const metadata: Metadata = {
  title: "Properties for Sale in Greece | 1Choice",
  description:
    "Curated properties for sale in Greece. Apartments, villas, investment opportunities and Golden Visa eligible real estate.",
  alternates: {
    canonical: "/properties",
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

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location } = await searchParams;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  let q = supabase
    .from("properties")
    .select("id,title,slug,price,location,bedrooms,bathrooms,size,featured,created_at,cover_image_path")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (location) q = q.eq("location", location);

  const { data } = await q;
  const properties = (data ?? []) as PropertyRow[];

  return (
    <Suspense>
      <PropertiesClient initialProperties={properties} />
    </Suspense>
  );
}
