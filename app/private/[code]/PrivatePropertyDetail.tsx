import PropertyGalleryClient from "@/components/Property/PropertyGalleryClient";
import PropertyAccordionsClient from "@/components/Property/PropertyAccordionsClient";
import Link from "next/link";

// Accepts the raw Supabase row — handles both legacy and current column names.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrivateProperty = Record<string, any>;

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

function SpecPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center bg-[#F4F4F4] rounded-xl px-5 py-3 min-w-[80px]">
      <span className="text-lg font-bold text-[#1E1E1E]">{value}</span>
      <span className="text-xs text-[#888888] uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

export default function PrivatePropertyDetail({
  property,
  coverUrl,
}: {
  property: PrivateProperty;
  coverUrl: string | null;
}) {
  // Handle both legacy (price / location / size) and current (price_eur / location_text / size_sqm) column names
  const price: number | null    = property.price_eur    ?? property.price    ?? null;
  const location: string        = property.location_text ?? property.location ?? "";
  const sizeSqm: number | null  = property.size_sqm     ?? property.size     ?? null;
  const bedrooms: number | null = property.bedrooms      ?? null;
  const bathrooms: number | null= property.bathrooms     ?? null;
  const floor: number | null    = property.floor         ?? null;
  const isGoldenVisa            = property.is_golden_visa === true;
  const description: string | null = property.description ?? null;
  const areaLabel = titleCase(location);
  const mapsQuery = encodeURIComponent(`${areaLabel}, Greece`);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">

        {/* Gallery — full width, no public badges */}
        <PropertyGalleryClient
          title={property.title}
          coverUrl={coverUrl}
          isFeatured={false}
          isGoldenVisa={isGoldenVisa}
          is1ChoiceDeal={false}
        />

        {/* 2-column layout */}
        <div className="flex flex-col md:flex-row gap-10 mt-10">

          {/* ── LEFT ~65% ── */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">

            {/* Private indicator — no breadcrumb to public catalog */}
            <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest">
              Private Listing
            </p>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] leading-tight mb-2">
                {property.title}
              </h1>
              <p className="text-[#404040] text-sm">{areaLabel}</p>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-[#1E1E1E]">
              {price ? formatPrice(price) : "Price on request"}
            </p>

            {/* Spec pills */}
            <div className="flex flex-wrap gap-3">
              {sizeSqm   && <SpecPill value={`${sizeSqm}`}   label="sqm" />}
              {bedrooms  && <SpecPill value={`${bedrooms}`}  label="bedrooms" />}
              {bathrooms && <SpecPill value={`${bathrooms}`} label="bathrooms" />}
              {floor     && <SpecPill value={`${floor}`}     label="floor" />}
            </div>

            {/* Golden Visa badge */}
            {isGoldenVisa && (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 w-fit">
                <span className="text-sm font-semibold text-amber-800">
                  Golden Visa Eligible
                </span>
              </div>
            )}

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
                {sizeSqm   && <><span className="text-[#888888]">Size</span>      <span className="text-[#1E1E1E] font-medium">{sizeSqm} sqm</span></>}
                {bedrooms  && <><span className="text-[#888888]">Bedrooms</span>  <span className="text-[#1E1E1E] font-medium">{bedrooms}</span></>}
                {bathrooms && <><span className="text-[#888888]">Bathrooms</span> <span className="text-[#1E1E1E] font-medium">{bathrooms}</span></>}
                {floor     && <><span className="text-[#888888]">Floor</span>     <span className="text-[#1E1E1E] font-medium">{floor}</span></>}
                <span className="text-[#888888]">Location</span>
                <span className="text-[#1E1E1E] font-medium">{areaLabel}</span>
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
                {sizeSqm   && <span>{sizeSqm} sqm</span>}
                {bedrooms  && <span>{bedrooms} bedrooms</span>}
                {bathrooms && <span>{bathrooms} bathrooms</span>}
                {floor     && <span>Floor {floor}</span>}
                <span>{areaLabel}</span>
                {isGoldenVisa && <span className="text-amber-700 font-medium">Golden Visa Eligible</span>}
              </div>

              {/* CTA */}
              <Link
                href="/contact"
                className="w-full py-3 rounded-xl bg-[#1E1E1E] text-white font-semibold text-sm text-center hover:bg-[#333333] transition-colors"
              >
                Contact Advisor
              </Link>
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

        {/* No similar properties — private listings are not cross-referenced */}

      </div>
    </main>
  );
}
