import type { Metadata } from "next";
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
    .select("title, price, location")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Property | 1Choice",
    };
  }

  return {
    title: `${data.title} | 1Choice`,
    description: `€${data.price} property located in ${data.location}. Explore full details on 1Choice.`,
    openGraph: {
      title: `${data.title} | 1Choice`,
      description: `€${data.price} property located in ${data.location}.`,
      type: "article",
      url: `https://1choice.gr/properties/${slug}`,
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

  const schema = property ? {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: `€${property.price} property located in ${property.location}`,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "EUR",
    },
  } : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <PropertyDetailClient />
    </>
  );
}
