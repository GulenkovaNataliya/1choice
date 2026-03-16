import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PropertyDetailClient, { type PropertyData } from "./PropertyDetailClient";
import SetChatContext from "@/components/chat/SetChatContext";
import { renderImageUrl } from "@/lib/storage/imageUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOCATION_SEO_CONFIG } from "@/lib/locations/locationSeoConfig";
import { listingFreshnessCutoff } from "@/lib/properties/publicListingFilters";

// ── Helpers ─────────────────────────────────────────────────────────────────

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("properties")
    .select("title, slug, price, price_eur, location, location_text, cover_image_url, cover_image_path, status, publish_1choice, private_collection")
    .eq("slug", slug)
    .single();

  // No property found — no canonical, no rich metadata
  if (!data) {
    return { title: "Property | 1Choice" };
  }

  // Non-public property — do not expose canonical or OG metadata
  if (
    data.status !== "published" ||
    data.publish_1choice !== true ||
    data.private_collection === true
  ) {
    return { title: "Property | 1Choice" };
  }

  // Use the slug from the resolved DB record — this is always the canonical/current slug,
  // never an old slug from property_slug_redirects (old slugs don't match properties.slug).
  const canonicalSlug = data.slug as string;
  const canonicalUrl = `https://1choice.gr/properties/${canonicalSlug}`;

  // Handle both legacy (price/location) and current (price_eur/location_text) column names
  const metaPrice    = (data as Record<string, unknown>).price_eur    ?? data.price    ?? null;
  const metaLocation = (data as Record<string, unknown>).location_text ?? data.location ?? null;

  const ogImageSrc = (data as Record<string, unknown>).cover_image_url as string | null
    ?? data.cover_image_path;
  const ogImage = renderImageUrl(ogImageSrc, "gallery") ?? undefined;

  const metaDescription = metaPrice && metaLocation
    ? `€${metaPrice} property located in ${metaLocation}. Explore full details on 1Choice.`
    : `${data.title} — explore full details on 1Choice.`;
  const ogDescription = metaPrice && metaLocation
    ? `€${metaPrice} property located in ${metaLocation}.`
    : `${data.title} on 1Choice.`;

  return {
    title: `${data.title} | 1Choice`,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${data.title} | 1Choice`,
      description: ogDescription,
      type: "article",
      url: canonicalUrl,
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

  const supabase = await createSupabaseServerClient();
  // Fetch full property data
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!property) {
    // Slug not found — check property_slug_redirects for a permanent redirect
    const { data: redirect } = await supabase
      .from("property_slug_redirects")
      .select("property_id")
      .eq("old_slug", slug)
      .single();

    if (redirect?.property_id) {
      const { data: current } = await supabase
        .from("properties")
        .select("slug, status, publish_1choice, private_collection")
        .eq("id", redirect.property_id)
        .single();

      if (
        current?.slug &&
        current.slug !== slug &&
        current.status === "published" &&
        current.publish_1choice === true &&
        current.private_collection !== true
      ) {
        permanentRedirect(`/properties/${current.slug}`);
      }
    }

    notFound();
  }

  // Public visibility guard
  if (
    property.status !== "published" ||
    property.publish_1choice !== true ||
    property.private_collection === true
  ) {
    notFound();
  }

  const coverUrl = renderImageUrl(
    property.cover_image_url ?? property.cover_image_path,
    "gallery"
  );

  // ── Internal linking queries ───────────────────────────────────────────────
  //
  // A. locationRows — "More properties in same area" (up to 6, featured-first)
  // B. priceSimilarRows — "Similar properties" (same category + price ±30%, up to 4)
  //
  // Both enforce: status=published, publish_1choice=true, private_collection=false

  const PROPERTY_FIELDS =
    "id,property_code,title,slug,price_eur,location,location_text,bedrooms,bathrooms,size_sqm,cover_image_url,gallery_image_urls,is_golden_visa,publish_deals,featured,private_collection,category,created_at";

  const propLocation = (property.location  ?? null) as string | null;
  const propCategory = (property.category  ?? null) as string | null;
  const propPrice    = (property.price_eur ?? (property as Record<string, unknown>).price ?? null) as number | null;

  // A — same location, up to 6, featured first
  let locationRows: Record<string, unknown>[] = [];
  if (propLocation) {
    const { data } = await supabase
      .from("properties")
      .select(PROPERTY_FIELDS)
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .neq("slug", slug)
      .eq("location", propLocation)
      .gte("updated_at", listingFreshnessCutoff())
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);
    locationRows = (data ?? []) as Record<string, unknown>[];
  }

  // B — same category + price ±30%, exclude current + locationRows to avoid duplicates
  let priceSimilarRows: Record<string, unknown>[] = [];
  if (propCategory) {
    const excludeIds = [property.id as string, ...locationRows.map((p) => p.id as string)];
    const baseQ = supabase
      .from("properties")
      .select(PROPERTY_FIELDS)
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .neq("slug", slug)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .eq("category", propCategory)
      .gte("updated_at", listingFreshnessCutoff())
      .order("featured", { ascending: false })
      .limit(4);
    const { data } =
      typeof propPrice === "number" && propPrice > 0
        ? await baseQ
            .gte("price_eur", Math.round(propPrice * 0.7))
            .lte("price_eur", Math.round(propPrice * 1.3))
        : await baseQ;
    priceSimilarRows = (data ?? []) as Record<string, unknown>[];
  }

  // ── Shared row → card shape mapper ────────────────────────────────────────
  function mapSimilar(p: Record<string, unknown>) {
    return {
      id:                 p.id as string,
      property_code:      (p.property_code     as string  | null) ?? null,
      slug:               p.slug as string,
      title:              p.title as string,
      area:               titleCase((p.location_text as string | null) ?? (p.location as string | null) ?? ""),
      price_eur:          (p.price_eur          as number  | null) ?? null,
      is_golden_visa:     (p.is_golden_visa     as boolean | null) ?? false,
      is_1choice_deal:    (p.publish_deals      as boolean | null) ?? false,
      featured:           (p.featured           as boolean | null) ?? false,
      private_collection: (p.private_collection as boolean | null) ?? false,
      cover_image_url:    (p.cover_image_url    as string  | null) ?? null,
      gallery_image_urls: (p.gallery_image_urls as string[]| null) ?? [],
      bedrooms:           (p.bedrooms           as number  | null) ?? undefined,
      bathrooms:          (p.bathrooms          as number  | null) ?? undefined,
      size_sqm:           (p.size_sqm           as number  | null) ?? undefined,
    };
  }

  const locationMapped  = locationRows.map(mapSimilar);
  const similarMapped   = priceSimilarRows.map(mapSimilar);

  // Location page URL — use dedicated location page if slug is in config, else catalogue filter
  const locationPageUrl = propLocation
    ? (propLocation in LOCATION_SEO_CONFIG
        ? `/properties/location/${propLocation}`
        : `/properties?location=${propLocation}`)
    : null;

  // ── Structured data ────────────────────────────────────────────────────────

  const BASE = "https://1choice.gr";
  // Canonical URL uses the slug from the resolved DB record, not the URL param
  const canonicalUrl = `${BASE}/properties/${property.slug}`;

  // Price — handle both legacy (price) and current (price_eur) column names
  const price: number | null = property.price_eur ?? property.price ?? null;

  // Image array for schema: cover first, then gallery (up to 8 total)
  const schemaImages: string[] = [
    ...(coverUrl ? [coverUrl] : []),
    ...(Array.isArray(property.gallery_image_urls)
      ? (property.gallery_image_urls as string[])
          .map((u) => renderImageUrl(u, "gallery"))
          .filter((u): u is string => !!u)
      : []),
  ].slice(0, 8);

  // Description — no null/empty strings in output
  const location = property.location_text ?? property.location ?? "";
  const description: string =
    (property.description as string | null)?.trim() ||
    `Property in ${titleCase(location)}, Greece`;

  // Product schema — null-safe field inclusion
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description,
    url: canonicalUrl,
    ...(property.property_code ? { sku: property.property_code } : {}),
    ...(schemaImages.length > 0
      ? { image: schemaImages.length === 1 ? schemaImages[0] : schemaImages }
      : {}),
    ...(typeof price === "number" && price > 0
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          },
        }
      : {}),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",       item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Properties", item: `${BASE}/properties` },
      { "@type": "ListItem", position: 3, name: property.title, item: canonicalUrl },
    ],
  };

  // Pre-process gallery URLs so all slots use the gallery preset (not raw originals)
  const processedProperty: PropertyData = {
    ...(property as PropertyData),
    gallery_image_urls: Array.isArray(property.gallery_image_urls)
      ? (property.gallery_image_urls as string[]).map(
          (url) => renderImageUrl(url, "gallery") ?? url
        )
      : null,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SetChatContext
        data={{
          property_id:       property.id,
          property_code:     property.property_code ?? null,
          property_title:    property.title,
          property_slug:     property.slug as string,
          property_location: (property.location_text ?? property.location) as string | null,
        }}
      />
      <PropertyDetailClient
        property={processedProperty}
        coverUrl={coverUrl}
        locationProperties={locationMapped}
        locationPageUrl={locationPageUrl}
        similarProperties={similarMapped}
      />
    </>
  );
}
