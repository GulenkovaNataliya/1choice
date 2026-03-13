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
    .select("title, slug, price, price_eur, location, location_text, cover_image_path, status, publish_1choice, private_collection, vip")
    .eq("slug", slug)
    .single();

  // No property found — no canonical, no rich metadata
  if (!data) {
    return { title: "Property | 1Choice" };
  }

  // Non-public property — do not expose canonical or OG metadata
  // Dual-check during vip→private_collection transition
  if (
    data.status !== "published" ||
    data.publish_1choice !== true ||
    data.private_collection === true ||
    data.vip === true
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

  const ogImage = renderImageUrl(data.cover_image_path, "gallery") ?? undefined;

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
        .select("slug")
        .eq("id", redirect.property_id)
        .single();

      if (current?.slug && current.slug !== slug) {
        permanentRedirect(`/properties/${current.slug}`);
      }
    }

    notFound();
  }

  // Public visibility guard — dual-check during vip→private_collection transition
  if (
    property.status !== "published" ||
    property.publish_1choice !== true ||
    property.private_collection === true ||
    property.vip === true
  ) {
    notFound();
  }

  const coverUrl = renderImageUrl(
    property.cover_image_url ?? property.cover_image_path,
    "gallery"
  );

  // Similar properties (same location first, then fallback to recent)
  const { data: similar } = await supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location,bedrooms,bathrooms,size_sqm,cover_image_url,gallery_image_urls,is_golden_visa,featured,private_collection,vip,created_at"
    )
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(4);

  const similarMapped = (similar ?? []).map((p) => ({
    id: p.id,
    property_code: p.property_code ?? null,
    slug: p.slug,
    title: p.title,
    area: titleCase(p.location ?? ""),
    price_eur: p.price_eur ?? null,
    is_golden_visa: p.is_golden_visa ?? false,
    is_1choice_deal: false,
    featured: p.featured ?? false,
    private_collection: p.private_collection ?? false,
    cover_image_url: p.cover_image_url ?? null,
    gallery_image_urls: (p.gallery_image_urls as string[] | null) ?? [],
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size_sqm ?? undefined,
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SetChatContext
        data={{
          property_id:    property.id,
          property_code:  property.property_code ?? null,
          property_title: property.title,
        }}
      />
      <PropertyDetailClient
        property={property as PropertyData}
        coverUrl={coverUrl}
        similarProperties={similarMapped}
      />
    </>
  );
}
