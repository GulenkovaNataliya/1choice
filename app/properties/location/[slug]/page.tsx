import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/Property/PropertyCard";
import LocationCtaBar from "./LocationCtaBar";
import { LOCATION_SEO_CONFIG, LOCATION_SLUGS } from "@/lib/locations/locationSeoConfig";
import { listingFreshnessCutoff } from "@/lib/properties/publicListingFilters";

// ── Static params — pre-render all known location slugs at build time ──────────

export function generateStaticParams() {
  return LOCATION_SLUGS.map((slug) => ({ slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = LOCATION_SEO_CONFIG[slug];
  if (!config) return {};

  const canonical = `/properties/location/${slug}`;
  return {
    title:       config.metaTitle,
    description: config.metaDescription,
    alternates:  { canonical },
    openGraph: {
      title:       config.metaTitle,
      description: config.metaDescription,
      url:         canonical,
    },
  };
}

// ── Property row shape from DB → PropertyCard shape ───────────────────────────

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
    id:               p.id as string,
    property_code:    (p.property_code as string | null) ?? null,
    slug:             p.slug as string,
    title:            p.title as string,
    area:             titleCase(
                        (p.location_text as string | null) ??
                        (p.location    as string | null) ?? ""
                      ),
    price_eur:        (p.price_eur        as number | null) ?? null,
    transaction_type: (p.transaction_type as string | null) ?? null,
    is_golden_visa:   (p.is_golden_visa   as boolean | null) ?? false,
    is_1choice_deal:  (p.publish_deals    as boolean | null) ?? false,
    featured:         (p.featured         as boolean | null) ?? false,
    cover_image_url:  (p.cover_image_url  as string | null) ?? null,
    gallery_image_urls: (p.gallery_image_urls as string[] | null) ?? [],
    bedrooms:         (p.bedrooms         as number | null) ?? null,
    bathrooms:        (p.bathrooms        as number | null) ?? null,
    size_sqm:         (p.size_sqm         as number | null) ?? null,
    floor:            (p.floor            as number | null) ?? null,
    year_built:       (p.year_built       as number | null) ?? null,
    sea_view:         (p.sea_view         as boolean | null) ?? null,
    pool:             (p.pool             as boolean | null) ?? null,
    elevator:         (p.elevator         as boolean | null) ?? null,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = LOCATION_SEO_CONFIG[slug];
  if (!config) notFound();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("properties")
    .select(
      "id,property_code,title,slug,price_eur,location,location_text," +
      "bedrooms,bathrooms,size_sqm,floor,year_built,featured," +
      "is_golden_visa,publish_deals,sea_view,pool,elevator," +
      "transaction_type,cover_image_url,gallery_image_urls"
    )
    .eq("location", slug)
    .eq("status", "published")
    .eq("publish_1choice", true)
    .neq("private_collection", true)
    .gte("updated_at", listingFreshnessCutoff())
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const properties = (data ?? []).map((p) => mapRow(p as DbRow));

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F9] border-b border-[#E8E8E8]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
            <Link href="/properties" className="hover:text-[#3A2E4F] transition-colors">
              Properties
            </Link>
            {" / "}
            {config.name}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-3">
            {config.name}
          </h1>
          <p className="text-base md:text-lg text-[#555555] max-w-2xl">
            {config.subtitle}
          </p>
        </div>
      </section>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <p className="text-sm md:text-base text-[#555555] leading-relaxed max-w-3xl">
          {config.intro}
        </p>
      </section>

      {/* ── Property grid ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {properties.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <p className="text-[#888888] text-sm max-w-xs leading-relaxed">
              No properties are currently listed in {config.name}. Check back soon or browse all listings.
            </p>
            <Link
              href="/properties"
              className="px-5 py-2.5 rounded-xl bg-[#3A2E4F] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Browse All Properties
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#888888] mb-6">
              {properties.length} {properties.length === 1 ? "property" : "properties"} in {config.name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#E8E8E8] bg-[#F9F9F9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-[#1E1E1E] mb-1">
              Interested in {config.name}?
            </h2>
            <p className="text-sm text-[#555555] max-w-md">
              Speak with a 1Choice advisor to arrange viewings or get personalised guidance on this area.
            </p>
          </div>
          <LocationCtaBar locationName={config.name} />
        </div>
      </section>

    </main>
  );
}
