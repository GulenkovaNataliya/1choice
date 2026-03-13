import { Fragment } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import PropertyGalleryClient from "@/components/Property/PropertyGalleryClient";
import PropertyCard from "@/components/Property/PropertyCard";
import PropertyCTAButtons from "@/components/Property/PropertyCTAButtons";
import {
  DETAIL_FEATURES,
  shouldRenderFeature,
  formatFeatureValue,
} from "@/lib/propertyFeatures";

// ── Types ───────────────────────────────────────────────────────────────────

export type PropertyData = {
  id: string;
  title: string;
  slug: string;
  property_code: string | null;
  price_eur: number | null;
  location: string | null;
  location_text: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  featured: boolean | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  is_golden_visa: boolean | null;
  publish_deals: boolean | null;
  summary: string | null;
  description: string | null;
  youtube_video_url: string | null;
  virtual_tour_url: string | null;
  // Building
  year_built: number | null;
  year_renovated: number | null;
  building_condition: string | null;
  energy_class: string | null;
  // Layout
  living_rooms: number | null;
  kitchens: number | null;
  storage_rooms: number | null;
  wc: number | null;
  // Windows & Construction
  frames_type: string | null;
  flooring_type: string | null;
  double_glazing: boolean | null;
  triple_glazing: boolean | null;
  mosquito_screens: boolean | null;
  thermal_insulation: boolean | null;
  sound_insulation: boolean | null;
  // Amenities
  fireplace: boolean | null;
  elevator: boolean | null;
  security_door: boolean | null;
  alarm_system: boolean | null;
  video_doorphone: boolean | null;
  smart_home: boolean | null;
  satellite_tv: boolean | null;
  internet_ready: boolean | null;
  storage: boolean | null;
  sea_view: boolean | null;
  mountain_view: boolean | null;
  garden: boolean | null;
  pool: boolean | null;
  // Location
  latitude: number | null;
  longitude: number | null;
  approximate_location: boolean | null;
};

type SimilarProperty = {
  id: string;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  featured: boolean;
  private_collection: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
};

type Props = {
  property: PropertyData;
  coverUrl: string | null;
  similarProperties: SimilarProperty[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return "€" + price.toLocaleString("en-EU");
}

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-[#404040]">
        <li>
          <Link href="/" className="hover:text-[#3A2E4F] transition">Home</Link>
          <span className="ml-2 text-[#BBBBBB] select-none">/</span>
        </li>
        <li>
          <Link href="/properties" className="hover:text-[#3A2E4F] transition">Properties</Link>
          <span className="ml-2 text-[#BBBBBB] select-none">/</span>
        </li>
        <li className="text-[#404040] truncate max-w-50" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

// ── Location block — 3 public scenarios ──────────────────────────────────────

function LocationBlock({
  latitude,
  longitude,
  approximate_location,
  areaLabel,
  mapsQuery,
}: {
  latitude: number | null;
  longitude: number | null;
  approximate_location: boolean | null;
  areaLabel: string;
  mapsQuery: string;
}) {
  const hasCoords =
    typeof latitude === "number" &&
    isFinite(latitude) &&
    typeof longitude === "number" &&
    isFinite(longitude);

  // ── Scenario 1: exact known coordinates ───────────────────────────────────
  if (hasCoords && !approximate_location) {
    const lat = latitude as number;
    const lng = longitude as number;
    const d = 0.005; // ~500 m delta
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return (
      <section className="mt-16">
        <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Location</h2>
        <div className="rounded-2xl overflow-hidden border border-[#E8E8E8]">
          <iframe
            src={osmUrl}
            title="Property location map"
            className="w-full h-64"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[#888888]">{areaLabel}</p>
          <a
            href={`https://maps.google.com?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2 shrink-0 ml-4"
          >
            Open in Google Maps
          </a>
        </div>
      </section>
    );
  }

  // ── Scenario 2: coordinates exist but flagged as approximate ──────────────
  if (hasCoords && approximate_location) {
    const lat = latitude as number;
    const lng = longitude as number;
    const d = 0.012; // larger bbox to convey imprecision (~1.2 km)
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return (
      <section className="mt-16">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Approximate location</h2>
          <span className="text-xs text-[#888888] bg-[#F4F4F4] px-2 py-0.5 rounded-full">
            Approximate
          </span>
        </div>
        <div className="rounded-2xl overflow-hidden border border-[#E8E8E8]">
          <iframe
            src={osmUrl}
            title="Approximate property location map"
            className="w-full h-64"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[#888888]">
            Exact address not publicly disclosed — shown area is approximate
          </p>
          <a
            href={`https://maps.google.com?q=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2 shrink-0"
          >
            Open in Google Maps
          </a>
        </div>
      </section>
    );
  }

  // ── Scenario 3: no coordinates — area reference only ─────────────────────
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Location</h2>
      <div className="bg-[#F4F4F4] rounded-2xl h-64 flex flex-col items-center justify-center gap-4 border border-[#E8E8E8]">
        <MapPin size={32} className="text-[#3A2E4F] opacity-40" />
        <div className="text-center">
          <p className="text-[#404040] text-sm font-medium">{areaLabel}</p>
          <p className="text-[#888888] text-xs mt-1">Area reference only</p>
        </div>
        <a
          href={`https://maps.google.com?q=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2"
        >
          Open in Google Maps
        </a>
      </div>
    </section>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PropertyDetailClient({ property, coverUrl, similarProperties }: Props) {
  const {
    title, price_eur, location, location_text, property_code,
    is_golden_visa, publish_deals, featured,
    summary, description, youtube_video_url, virtual_tour_url,
    gallery_image_urls,
  } = property;

  const areaLabel = titleCase(location_text ?? location ?? "");
  const mapsQuery = encodeURIComponent(`${areaLabel}, Greece`);

  // Cast property to a plain record for dynamic DETAIL_FEATURES lookup
  const featureRecord = property as Record<string, unknown>;

  // Split features: numeric/string vs boolean
  const valueFeatures = DETAIL_FEATURES.filter(
    (f) => f.valueType !== "boolean" && f.group !== "premium" && shouldRenderFeature(f, featureRecord[f.field])
  );
  const booleanFeatures = DETAIL_FEATURES.filter(
    (f) => f.valueType === "boolean" && f.group !== "premium" && shouldRenderFeature(f, featureRecord[f.field])
  );

  const youtubeId = youtube_video_url ? extractYouTubeId(youtube_video_url) : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">

        {/* Gallery — full width */}
        <PropertyGalleryClient
          title={title}
          coverUrl={coverUrl}
          galleryUrls={Array.isArray(gallery_image_urls) ? gallery_image_urls : []}
          isFeatured={featured ?? false}
          isGoldenVisa={is_golden_visa ?? false}
          is1ChoiceDeal={publish_deals ?? false}
        />

        {/* 2-column layout */}
        <div className="flex flex-col md:flex-row gap-10 mt-10">

          {/* ── LEFT ~65% ── */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">
            <Breadcrumb title={title} />

            {/* Title + property code + badges */}
            <div>
              {property_code && (
                <p className="text-xs text-[#888888] font-mono mb-1">{property_code}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] leading-tight mb-2">
                {title}
              </h1>
              <p className="text-[#404040] text-sm mb-3">{areaLabel}</p>

              {/* Inline badges */}
              <div className="flex flex-wrap gap-2">
                {featured && (
                  <span className="bg-[#F4F4F4] text-[#1E1E1E] text-xs font-medium px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
                {is_golden_visa && (
                  <span className="bg-[#FFF8E1] text-[#B8860B] text-xs font-medium px-3 py-1 rounded-full">
                    Golden Visa
                  </span>
                )}
                {publish_deals && (
                  <span className="bg-[#FFF0F0] text-[#C1121F] text-xs font-medium px-3 py-1 rounded-full">
                    1ChoiceDeals
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-[#1E1E1E]">
              {price_eur ? formatPrice(price_eur) : "Price on request"}
            </p>

            {/* Summary */}
            {summary && (
              <p className="text-[#404040] text-sm leading-relaxed font-medium">
                {summary}
              </p>
            )}

            {/* Description */}
            {description && (
              <div className="text-[#404040] text-sm leading-relaxed">
                {description}
              </div>
            )}

            {/* Characteristics */}
            {(valueFeatures.length > 0 || booleanFeatures.length > 0) && (
              <div>
                <h2 className="text-base font-semibold text-[#1E1E1E] mb-4">Characteristics</h2>

                {/* Numeric / string features */}
                {valueFeatures.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                    {valueFeatures.map((f) => {
                      const val = formatFeatureValue(f, featureRecord[f.field]);
                      const Icon = f.icon;
                      return (
                        <Fragment key={f.field}>
                          <span className="flex items-center gap-1.5 text-[#888888]">
                            <Icon size={14} />
                            {f.label}
                          </span>
                          <span className="text-[#1E1E1E] font-medium">{val}</span>
                        </Fragment>
                      );
                    })}
                    {/* Location always shown */}
                    <span className="flex items-center gap-1.5 text-[#888888]">
                      <MapPin size={14} />
                      Location
                    </span>
                    <span className="text-[#1E1E1E] font-medium">{areaLabel}</span>
                  </div>
                )}

                {/* Boolean feature pills */}
                {booleanFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {booleanFeatures.map((f) => {
                      const Icon = f.icon;
                      return (
                        <span
                          key={f.field}
                          className="flex items-center gap-1.5 bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full"
                        >
                          <Icon size={12} />
                          {f.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Media block — YouTube */}
            {youtubeId && (
              <div>
                <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Video Tour</h2>
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Property video tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Media block — Virtual tour */}
            {virtual_tour_url && (
              <div>
                <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Virtual Tour</h2>
                <a
                  href={virtual_tour_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#3A2E4F] text-[#3A2E4F] text-sm font-medium hover:bg-[#F0EDF7] transition-colors"
                >
                  Open Virtual Tour →
                </a>
              </div>
            )}
          </div>

          {/* ── RIGHT ~35% sticky ── */}
          <div className="w-full md:w-[35%]">
            <div className="md:sticky md:top-8 self-start bg-white border border-[#E8E8E8] rounded-2xl p-6 flex flex-col gap-5">
              <p className="text-2xl font-bold text-[#1E1E1E]">
                {price_eur ? formatPrice(price_eur) : "Price on request"}
              </p>

              {/* Quick facts */}
              <div className="flex flex-col gap-2 text-sm text-[#404040] border-b border-[#F0F0F0] pb-5">
                {property.size_sqm    && <span>{property.size_sqm} m²</span>}
                {property.bedrooms    && <span>{property.bedrooms} bedrooms</span>}
                {property.bathrooms   && <span>{property.bathrooms} bathrooms</span>}
                {property.floor       && <span>Floor {property.floor}</span>}
                <span>{areaLabel}</span>
              </div>

              {/* CTAs */}
              <PropertyCTAButtons />
            </div>
          </div>

        </div>

        {/* Location */}
        <LocationBlock
          latitude={property.latitude}
          longitude={property.longitude}
          approximate_location={property.approximate_location}
          areaLabel={areaLabel}
          mapsQuery={mapsQuery}
        />

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-[#1E1E1E] mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
