import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PropertyDetailClient, { type PropertyData } from "./PropertyDetailClient";
import SetChatContext from "@/components/chat/SetChatContext";
import { renderImageUrl } from "@/lib/storage/imageUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // ── Similar properties ─────────────────────────────────────────────────────
  //
  // Relevance priority:
  //   Tier 1 — same location: fetch up to 8, sort client-side by
  //     transaction_type match (2pts) + category match (1pt), take top 4
  //   Tier 2 — fallback: most-recent public properties not already in tier 1
  //
  // All tiers enforce: status=published, publish_1choice=true, private_collection=false

  const SIMILAR_FIELDS =
    "id,property_code,title,slug,price_eur,location,location_text,bedrooms,bathrooms,size_sqm,cover_image_url,gallery_image_urls,is_golden_visa,publish_deals,featured,private_collection,transaction_type,category,created_at";
  const SIMILAR_LIMIT = 4;

  const propLocation = (property.location ?? null) as string | null;
  const propTxType   = (property.transaction_type ?? null) as string | null;
  const propCategory = (property.category ?? null) as string | null;

  // Tier 1 — same location
  let tier1: Record<string, unknown>[] = [];
  if (propLocation) {
    const { data } = await supabase
      .from("properties")
      .select(SIMILAR_FIELDS)
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .neq("slug", slug)
      .eq("location", propLocation)
      .limit(8);
    const candidates = (data ?? []) as Record<string, unknown>[];
    candidates.sort((a, b) => {
      const sa = (a.transaction_type === propTxType ? 2 : 0) + (a.category === propCategory ? 1 : 0);
      const sb = (b.transaction_type === propTxType ? 2 : 0) + (b.category === propCategory ? 1 : 0);
      return sb - sa;
    });
    tier1 = candidates.slice(0, SIMILAR_LIMIT);
  }

  // Tier 2 — fallback: recent public properties not already found
  let tier2: Record<string, unknown>[] = [];
  if (tier1.length < SIMILAR_LIMIT) {
    const excludeIds = [...tier1.map((p) => p.id as string), property.id as string];
    const { data } = await supabase
      .from("properties")
      .select(SIMILAR_FIELDS)
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .neq("slug", slug)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(SIMILAR_LIMIT);
    tier2 = (data ?? []) as Record<string, unknown>[];
  }

  // Merge, deduplicate, cap at SIMILAR_LIMIT
  const seenSimilarIds = new Set<string>(tier1.map((p) => p.id as string));
  const allSimilar: Record<string, unknown>[] = [...tier1];
  for (const p of tier2) {
    if (!seenSimilarIds.has(p.id as string) && allSimilar.length < SIMILAR_LIMIT) {
      allSimilar.push(p);
      seenSimilarIds.add(p.id as string);
    }
  }

  const similarMapped = allSimilar.map((p) => ({
    id: p.id as string,
    property_code: (p.property_code as string | null) ?? null,
    slug: p.slug as string,
    title: p.title as string,
    area: titleCase((p.location_text as string | null) ?? (p.location as string | null) ?? ""),
    price_eur: (p.price_eur as number | null) ?? null,
    is_golden_visa: (p.is_golden_visa as boolean | null) ?? false,
    is_1choice_deal: (p.publish_deals as boolean | null) ?? false,
    featured: (p.featured as boolean | null) ?? false,
    private_collection: (p.private_collection as boolean | null) ?? false,
    cover_image_url: (p.cover_image_url as string | null) ?? null,
    gallery_image_urls: (p.gallery_image_urls as string[] | null) ?? [],
    bedrooms: (p.bedrooms as number | null) ?? undefined,
    bathrooms: (p.bathrooms as number | null) ?? undefined,
    size_sqm: (p.size_sqm as number | null) ?? undefined,
  }));

  // ── Structured data ────────────────────────────────────────────────────────

  const BASE = "https://1choice.gr";
  // Canonical URL uses the slug from the resolved DB record, not the URL param
  const canonicalUrl = `${BASE}/properties/${property.slug}`;

  // Price — handle both legacy (price) and current (price_eur) column names
  const price: number | null = property.price_eur ?? property.price ?? null;

  // Best available image: cover first, then first gallery item
  const imageUrl: string | null =
    coverUrl ??
    (Array.isArray(property.gallery_image_urls) && property.gallery_image_urls.length > 0
      ? (renderImageUrl(property.gallery_image_urls[0], "gallery") ?? null)
      : null);

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
    ...(imageUrl ? { image: imageUrl } : {}),
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
        similarProperties={similarMapped}
      />
    </>
  );
}
