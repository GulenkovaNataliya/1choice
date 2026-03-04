import Link from "next/link";
import PropertyGalleryClient from "@/components/Property/PropertyGalleryClient";
import PropertyAccordionsClient from "@/components/Property/PropertyAccordionsClient";
import PropertyCard from "@/components/Property/PropertyCard";

// ── Types ───────────────────────────────────────────────────────────────────

export type PropertyData = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  featured: boolean | null;
  cover_image_path: string | null;
  is_golden_visa?: boolean | null;
  is_1choice_deal?: boolean | null;
  description?: string | null;
  floor?: number | null;
};

type SimilarProperty = {
  id: string;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  cover_image: string | null;
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
        <li className="text-[#404040] truncate max-w-[200px]" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

function SpecPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center bg-[#F4F4F4] rounded-xl px-5 py-3 min-w-[80px]">
      <span className="text-lg font-bold text-[#1E1E1E]">{value}</span>
      <span className="text-xs text-[#888888] uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PropertyDetailClient({ property, coverUrl, similarProperties }: Props) {
  const {
    title, price, location, bedrooms, bathrooms, size, featured,
    is_golden_visa, is_1choice_deal, description, floor,
  } = property;

  const areaLabel = titleCase(location ?? "");

  const mapsQuery = encodeURIComponent(`${areaLabel}, Greece`);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">

        {/* Gallery — full width */}
        <PropertyGalleryClient
          title={title}
          coverUrl={coverUrl}
          isFeatured={featured ?? false}
          isGoldenVisa={is_golden_visa ?? false}
          is1ChoiceDeal={is_1choice_deal ?? false}
        />

        {/* 2-column layout */}
        <div className="flex flex-col md:flex-row gap-10 mt-10">

          {/* ── LEFT ~65% ── */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">
            <Breadcrumb title={title} />

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] leading-tight mb-2">
                {title}
              </h1>
              <p className="text-[#404040] text-sm">{areaLabel}</p>
            </div>

            <p className="text-2xl font-bold text-[#1E1E1E]">
              {price ? formatPrice(price) : "Price on request"}
            </p>

            {/* Spec pills */}
            <div className="flex flex-wrap gap-3">
              {size      && <SpecPill value={`${size}`}       label="sqm" />}
              {bedrooms  && <SpecPill value={`${bedrooms}`}   label="bedrooms" />}
              {bathrooms && <SpecPill value={`${bathrooms}`}  label="bathrooms" />}
              {floor     && <SpecPill value={`${floor}`}      label="floor" />}
            </div>

            {/* Description */}
            {description && (
              <div className="text-[#404040] text-sm leading-relaxed">
                {description}
              </div>
            )}

            {/* Characteristics grid */}
            <div>
              <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Characteristics</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {size      && <><span className="text-[#888888]">Size</span>        <span className="text-[#1E1E1E] font-medium">{size} sqm</span></>}
                {bedrooms  && <><span className="text-[#888888]">Bedrooms</span>    <span className="text-[#1E1E1E] font-medium">{bedrooms}</span></>}
                {bathrooms && <><span className="text-[#888888]">Bathrooms</span>   <span className="text-[#1E1E1E] font-medium">{bathrooms}</span></>}
                {floor     && <><span className="text-[#888888]">Floor</span>       <span className="text-[#1E1E1E] font-medium">{floor}</span></>}
                <span className="text-[#888888]">Location</span>  <span className="text-[#1E1E1E] font-medium">{areaLabel}</span>
              </div>
            </div>

            {/* Accordions */}
            <div>
              <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Property Details</h2>
              <PropertyAccordionsClient />
            </div>
          </div>

          {/* ── RIGHT ~35% sticky ── */}
          <div className="w-full md:w-[35%]">
            <div className="md:sticky md:top-8 self-start bg-white border border-[#E8E8E8] rounded-2xl p-6 flex flex-col gap-5">
              <p className="text-2xl font-bold text-[#1E1E1E]">
                {price ? formatPrice(price) : "Price on request"}
              </p>

              {/* Quick facts */}
              <div className="flex flex-col gap-2 text-sm text-[#404040] border-b border-[#F0F0F0] pb-5">
                {size      && <span>{size} sqm</span>}
                {bedrooms  && <span>{bedrooms} bedrooms</span>}
                {bathrooms && <span>{bathrooms} bathrooms</span>}
                {floor     && <span>Floor {floor}</span>}
                <span>{areaLabel}</span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                {/* TODO: wire to chat/consultation handler when available */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-[#1E1E1E] text-[#C1121F] font-semibold text-sm opacity-60 cursor-default pointer-events-none"
                >
                  Start a Conversation
                </button>
                {/* TODO: wire to schedule viewing flow when available */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-[#3A2E4F] text-[#D9D9D9] font-medium text-sm opacity-60 cursor-default pointer-events-none"
                >
                  Schedule Viewing
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Map */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Location</h2>
          <div className="bg-[#F4F4F4] rounded-2xl h-64 flex flex-col items-center justify-center gap-4 border border-[#E8E8E8]">
            <div className="w-16 h-16 rounded-full border-4 border-[#3A2E4F] opacity-30" />
            <p className="text-[#888888] text-sm">Approximate area: {areaLabel}</p>
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
