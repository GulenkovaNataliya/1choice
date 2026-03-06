import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PropertyDetailClient, { type PropertyData } from "@/app/properties/[slug]/PropertyDetailClient";
import { renderImageUrl } from "@/lib/storage/imageUrl";

export const metadata = {
  robots: { index: false, follow: false },
};

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function PrivatePropertyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Resolve by property_code
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("property_code", code)
    .single();

  // 2. Not found
  if (!property) notFound();

  // 3. Must be VIP — no status / publish_1choice check
  if (property.vip !== true) notFound();

  // 4. Build cover URL
  const coverUrl = renderImageUrl(
    property.cover_image_url ?? property.cover_image_path,
    "gallery"
  );

  // 5. Similar VIP properties (same pattern as public detail page)
  const { data: similar } = await supabase
    .from("properties")
    .select(
      "id,title,slug,price,location,bedrooms,bathrooms,size,cover_image_path,is_golden_visa,created_at"
    )
    .eq("vip", true)
    .neq("property_code", code)
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
    cover_image: renderImageUrl(p.cover_image_path, "catalog"),
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
