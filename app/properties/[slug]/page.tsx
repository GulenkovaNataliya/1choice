import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PropertyDetailClient, { type PropertyData } from "./PropertyDetailClient";

// ── Helpers ─────────────────────────────────────────────────────────────────

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Metadata (unchanged) ─────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const { createClient: create } = await import("@supabase/supabase-js");
  const supabase = create(url, key);

  const { data } = await supabase
    .from("properties")
    .select("title, price, location, cover_image_path")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Property | 1Choice",
    };
  }

  const supabaseHost = new URL(url).host;
  const ogImage = data.cover_image_path
    ? `https://${supabaseHost}/storage/v1/object/public/property-images/${data.cover_image_path}`
    : undefined;

  return {
    title: `${data.title} | 1Choice`,
    description: `€${data.price} property located in ${data.location}. Explore full details on 1Choice.`,
    openGraph: {
      title: `${data.title} | 1Choice`,
      description: `€${data.price} property located in ${data.location}.`,
      type: "article",
      url: `https://1choice.gr/properties/${slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  const supabaseHost = new URL(url).host;

  // Fetch full property data
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!property) notFound();

  const coverUrl = property.cover_image_path
    ? `https://${supabaseHost}/storage/v1/object/public/property-images/${property.cover_image_path}`
    : null;

  // Similar properties (same location first, then fallback to recent)
  const { data: similar } = await supabase
    .from("properties")
    .select(
      "id,title,slug,price,location,bedrooms,bathrooms,size,cover_image_path,is_golden_visa,created_at"
    )
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(4);

  const similarMapped = (similar ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    area: titleCase(p.location ?? ""),
    price_eur: p.price,
    is_golden_visa: p.is_golden_visa ?? false,
    is_1choice_deal: false,
    cover_image: p.cover_image_path
      ? `https://${supabaseHost}/storage/v1/object/public/property-images/${p.cover_image_path}`
      : null,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size ?? undefined,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description:
      property.description ??
      `€${property.price} property located in ${property.location}`,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "EUR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PropertyDetailClient
        property={property as PropertyData}
        coverUrl={coverUrl}
        similarProperties={similarMapped}
      />
    </>
  );
}
