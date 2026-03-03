import type { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slugToTitle(slug)} | First Choice Real Estate`,
  };
}

export default async function PropertyDetailPage({
  params: _params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PropertyDetailClient />;
}
