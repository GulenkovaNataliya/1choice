import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailClient from "./PropertyDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

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

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const { data: property } = await supabase
    .from("properties")
    .select("title, price, location")
    .eq("slug", slug)
    .single();

  if (!property) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: `€${property.price} property located in ${property.location}`,
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
      <PropertyDetailClient />
    </>
  );
}
