import type { Metadata } from "next";
import { mockProperties } from "@/components/Property/mockProperties";
import PropertyDetailClient from "./PropertyDetailClient";

// ─── JSON-LD builder ──────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.1choice.gr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildJsonLd(slug: string): Record<string, any> | null {
  const property = mockProperties.find(p => p.slug === slug);
  if (!property) return null;

  const { title, area, price_eur, cover_image } = property;

  const areaName = area.split(",")[0].trim();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description: buildDescription(slug),
    url: `${SITE_URL}/properties/${slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: areaName,
      addressCountry: "GR",
    },
    ...(cover_image && { image: cover_image }),
  };

  if (price_eur !== null) {
    jsonLd.offers = {
      "@type": "Offer",
      price: price_eur,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    };
  }

  return jsonLd;
}

// ─── Metadata builder ─────────────────────────────────────────────────────────

function buildDescription(slug: string): string {
  const property = mockProperties.find(p => p.slug === slug);
  if (!property) return "First Choice Real Estate.";

  const { type, area, bedrooms, size_sqm } = property;

  // Capitalise type: "apartment" → "Apartment"
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  // First segment of area: "Glyfada, Athens Riviera" → "Glyfada"
  const areaName = area.split(",")[0].trim();

  const parts: string[] = [`${typeLabel} in ${areaName}`];
  if (bedrooms)  parts.push(`${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`);
  if (size_sqm)  parts.push(`${size_sqm} sqm`);

  return `${parts.join(", ")}. First Choice Real Estate.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = mockProperties.find(p => p.slug === slug);

  if (!property) {
    return {
      title: "Property Not Found | First Choice Real Estate",
    };
  }

  const pageTitle = `${property.title} | First Choice Real Estate`;
  const description = buildDescription(slug);

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      ...(property.cover_image && {
        images: [{ url: property.cover_image }],
      }),
    },
  };
}

// ─── Page (Server Component shell) ───────────────────────────────────────────

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jsonLd = buildJsonLd(slug);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailClient />
    </>
  );
}
