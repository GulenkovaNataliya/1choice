import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DealsGrid from "./DealsGrid";

export const metadata: Metadata = {
  title: "1ChoiceDeals | 1Choice Real Estate",
  description: "A curated selection of properties with verified value and direct pricing in Greece.",
};

type DbRow = Record<string, unknown>;

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapRow(p: DbRow) {
  return {
    id:                 p.id as string,
    property_code:      (p.property_code      as string  | null) ?? null,
    slug:               p.slug as string,
    title:              p.title as string,
    area:               titleCase(
                          (p.location_text as string | null) ??
                          (p.location      as string | null) ?? ""
                        ),
    price_eur:          (p.price_eur          as number  | null) ?? null,
    transaction_type:   (p.transaction_type   as string  | null) ?? null,
    is_golden_visa:     (p.is_golden_visa     as boolean | null) ?? false,
    is_1choice_deal:    true,   // all rows here satisfy publish_deals=true
    featured:           (p.featured           as boolean | null) ?? false,
    cover_image_url:    (p.cover_image_url    as string  | null) ?? null,
    gallery_image_urls: (p.gallery_image_urls as string[] | null) ?? [],
    bedrooms:           (p.bedrooms           as number  | null) ?? null,
    bathrooms:          (p.bathrooms          as number  | null) ?? null,
    size_sqm:           (p.size_sqm           as number  | null) ?? null,
    floor:              (p.floor              as number  | null) ?? null,
    year_built:         (p.year_built         as number  | null) ?? null,
    sea_view:           (p.sea_view           as boolean | null) ?? null,
    pool:               (p.pool               as boolean | null) ?? null,
    elevator:           (p.elevator           as boolean | null) ?? null,
    custom_badge:       (p.custom_badge       as string  | null) ?? null,
    custom_badge_color: (p.custom_badge_color as string  | null) ?? null,
  };
}

export default async function OneChoiceDealsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location,location_text,transaction_type," +
      "bedrooms,bathrooms,size_sqm,floor,year_built,featured,is_golden_visa," +
      "sea_view,pool,elevator,cover_image_url,gallery_image_urls,custom_badge,custom_badge_color"
    )
    .eq("status", "published")
    .eq("publish_deals", true)
    .neq("private_collection", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const deals = (data ?? []).map((p) => mapRow(p as unknown as DbRow));

  return (
    <main style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1E1E1E",
            margin: "0 0 12px",
          }}
        >
          1ChoiceDeals
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#404040",
            margin: "0 0 40px",
            lineHeight: 1.5,
          }}
        >
          A curated selection of properties with verified value and direct pricing.
        </p>

        <DealsGrid deals={deals} />
      </div>
    </main>
  );
}
