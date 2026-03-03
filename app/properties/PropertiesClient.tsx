"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PropertyRow } from "@/lib/properties/fetchProperties";
import { publicImageUrl } from "@/lib/storage/publicImageUrl";
import PropertyCard from "@/components/Property/PropertyCard";
import HorizontalFilter, { type FilterState } from "@/components/Home/HorizontalFilter";

// ─── Types ────────────────────────────────────────────────────────────────────

type Chip = {
  label: string;
  removes: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const FEATURE_LABEL: Record<string, string> = {
  parking: "Parking", pool: "Pool", seaview: "Sea View",
  garden: "Garden", furnished: "Furnished", investment: "Investment",
};

const CONDITION_LABEL: Record<string, string> = {
  renovated: "Renovated",
  needsrenovation: "Needs Renovation",
  underconstruction: "Under Construction",
};

const TRANSACTION_FROM_URL: Record<string, string> = {
  buy: "Buy", rent: "Rent", antiparochi: "Antiparochi",
};

const FEATURE_FROM_URL: Record<string, string> = {
  parking: "Parking", pool: "Pool", seaview: "Sea View",
  garden: "Garden", furnished: "Furnished", investment: "Investment",
};

const CONDITION_FROM_URL: Record<string, string> = {
  renovated: "Renovated",
  needsrenovation: "Needs renovation",
  underconstruction: "Under construction",
};

function parseParamsToFilter(params: ReadonlyURLSearchParams): Partial<FilterState> {
  const f: Partial<FilterState> = {};

  const transaction = params.get("transaction");
  if (transaction) f.transaction = TRANSACTION_FROM_URL[transaction] ?? "";

  const type = params.get("type");
  if (type) f.propertyTypes = type.split(",").map(t => t.charAt(0).toUpperCase() + t.slice(1));

  const location = params.get("location");
  if (location) f.location = location;

  const priceMin = params.get("priceMin");
  if (priceMin) f.priceMin = priceMin;

  const priceMax = params.get("priceMax");
  if (priceMax) f.priceMax = priceMax;

  const bedrooms = params.get("bedrooms");
  if (bedrooms) f.bedrooms = `${bedrooms}+`;

  if (params.get("gv") === "1") f.goldenVisa = true;

  const features = params.get("features");
  if (features) f.features = features.split(",").map(s => FEATURE_FROM_URL[s] ?? s);

  const baths = params.get("baths");
  if (baths) f.bathrooms = `${baths}+`;

  const sizeMin = params.get("sizeMin");
  if (sizeMin) f.sizeMin = sizeMin;

  const sizeMax = params.get("sizeMax");
  if (sizeMax) f.sizeMax = sizeMax;

  const yearMin = params.get("yearMin");
  if (yearMin) f.yearMin = yearMin;

  const yearMax = params.get("yearMax");
  if (yearMax) f.yearMax = yearMax;

  const condition = params.get("condition");
  if (condition) f.conditions = condition.split(",").map(s => CONDITION_FROM_URL[s] ?? s);

  return f;
}

function buildChips(params: ReadonlyURLSearchParams): Chip[] {
  const chips: Chip[] = [];

  const transaction = params.get("transaction");
  if (transaction)
    chips.push({ label: `Transaction: ${titleCase(transaction)}`, removes: ["transaction"] });

  const type = params.get("type");
  if (type)
    chips.push({ label: `Type: ${type.split(",").map(titleCase).join(", ")}`, removes: ["type"] });

  const location = params.get("location");
  if (location)
    chips.push({ label: `Location: ${titleCase(location)}`, removes: ["location"] });

  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  if (priceMin || priceMax) {
    const label = priceMin && priceMax ? `Price: ${priceMin}–${priceMax}`
      : priceMin ? `Price: from ${priceMin}` : `Price: up to ${priceMax}`;
    chips.push({ label, removes: ["priceMin", "priceMax"] });
  }

  const bedrooms = params.get("bedrooms");
  if (bedrooms)
    chips.push({ label: `Bedrooms: ${bedrooms}+`, removes: ["bedrooms"] });

  if (params.get("gv") === "1")
    chips.push({ label: "Golden Visa: Eligible", removes: ["gv"] });

  const features = params.get("features");
  if (features) {
    const labels = features.split(",").map(f => FEATURE_LABEL[f] ?? titleCase(f)).join(", ");
    chips.push({ label: `Features: ${labels}`, removes: ["features"] });
  }

  const baths = params.get("baths");
  if (baths)
    chips.push({ label: `Bathrooms: ${baths}+`, removes: ["baths"] });

  const sizeMin = params.get("sizeMin");
  const sizeMax = params.get("sizeMax");
  if (sizeMin || sizeMax) {
    const label = sizeMin && sizeMax ? `Size: ${sizeMin}–${sizeMax} sqm`
      : sizeMin ? `Size: from ${sizeMin} sqm` : `Size: up to ${sizeMax} sqm`;
    chips.push({ label, removes: ["sizeMin", "sizeMax"] });
  }

  const yearMin = params.get("yearMin");
  const yearMax = params.get("yearMax");
  if (yearMin || yearMax) {
    const label = yearMin && yearMax ? `Year: ${yearMin}–${yearMax}`
      : yearMin ? `Year: from ${yearMin}` : `Year: up to ${yearMax}`;
    chips.push({ label, removes: ["yearMin", "yearMax"] });
  }

  const condition = params.get("condition");
  if (condition) {
    const labels = condition.split(",").map(c => CONDITION_LABEL[c] ?? titleCase(c)).join(", ");
    chips.push({ label: `Condition: ${labels}`, removes: ["condition"] });
  }

  return chips;
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = "curated" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "curated",    label: "Curated" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest",     label: "Newest" },
];

function applySort(properties: PropertyRow[], sort: SortKey): PropertyRow[] {
  if (sort === "curated") return properties;
  const arr = [...properties];
  switch (sort) {
    case "price_asc":  return arr.sort((a, b) => a.price - b.price);
    case "price_desc": return arr.sort((a, b) => b.price - a.price);
    case "newest":     return arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    default:           return properties;
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────

function applyFilters(properties: PropertyRow[], params: ReadonlyURLSearchParams): PropertyRow[] {
  return properties.filter(p => {
    const priceMin = params.get("priceMin");
    if (priceMin && p.price < Number(priceMin) * 1000) return false;

    const priceMax = params.get("priceMax");
    if (priceMax && p.price > Number(priceMax) * 1000) return false;

    const bedrooms = params.get("bedrooms");
    if (bedrooms && (p.bedrooms === null || p.bedrooms < Number(bedrooms))) return false;

    const baths = params.get("baths");
    if (baths && (p.bathrooms === null || p.bathrooms < Number(baths))) return false;

    const sizeMin = params.get("sizeMin");
    if (sizeMin && (p.size === null || p.size < Number(sizeMin))) return false;

    const sizeMax = params.get("sizeMax");
    if (sizeMax && (p.size === null || p.size > Number(sizeMax))) return false;

    return true;
  });
}

// ─── FilterChips ──────────────────────────────────────────────────────────────

function FilterChips({ chips, onRemove }: { chips: Chip[]; onRemove: (keys: string[]) => void }) {
  if (chips.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0 20px" }}>
      {chips.map(chip => (
        <span
          key={chip.label}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#D9D9D9", color: "#3A2E4F", borderRadius: 16,
            padding: "0 8px 0 12px", height: 32, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
          }}
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.removes)}
            aria-label={`Remove ${chip.label}`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#3A2E4F", fontSize: 18, lineHeight: 1,
              padding: "0 4px", display: "flex", alignItems: "center", opacity: 0.55,
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function PropertiesClient({
  initialProperties,
  currentPage,
  totalPages,
  total,
}: {
  initialProperties: PropertyRow[];
  currentPage: number;
  totalPages: number;
  total: number;
}) {
  const params = useSearchParams();
  const router = useRouter();

  const sort = (params.get("sort") ?? "curated") as SortKey;
  const chips = buildChips(params);
  const initialFilter = useMemo(() => parseParamsToFilter(params), [params]);

  const filtered = applySort(applyFilters(initialProperties, params), sort);

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const paramStr = params.toString();
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [paramStr]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const uiItems = visible.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    area: titleCase(p.location),
    price_eur: p.price,
    is_golden_visa: false,
    is_1choice_deal: p.featured ?? false,
    cover_image: p.cover_image_path ? publicImageUrl(p.cover_image_path) : null,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size ?? undefined,
  }));

  function removeFilter(keys: string[]) {
    const next = new URLSearchParams(params.toString());
    keys.forEach(k => next.delete(k));
    const qs = next.toString();
    router.replace(`/properties${qs ? `?${qs}` : ""}`);
  }

  function resetFilters() { router.replace("/properties"); }

  function setSort(value: SortKey) {
    const next = new URLSearchParams(params.toString());
    if (value === "curated") next.delete("sort");
    else next.set("sort", value);
    const qs = next.toString();
    router.replace(`/properties${qs ? `?${qs}` : ""}`);
  }

  return (
    <>
      <style>{`
        .lm-btn:hover{box-shadow:0 4px 18px rgba(58,46,79,0.28)}
        .rs-btn:hover{box-shadow:0 4px 18px rgba(58,46,79,0.28)}
        @media (min-width:1024px){
          .filter-sticky-wrap{position:sticky;top:0;z-index:100;background:#FFFFFF;border-bottom:1px solid #D9D9D9}
        }
      `}</style>

      <div className="filter-sticky-wrap">
        <HorizontalFilter
          initialFilter={initialFilter}
          onSearch={(p) => {
            const existingSort = params.get("sort");
            if (existingSort) p.set("sort", existingSort);
            const qs = p.toString();
            router.replace(`/properties${qs ? `?${qs}` : ""}`);
          }}
        />
      </div>

      <main style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "48px 24px 80px" }}>

          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1E1E1E", margin: "0 0 4px" }}>
            Properties
          </h1>

          <FilterChips chips={chips} onRemove={removeFilter} />

          {filtered.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 24px", gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#1E1E1E" }}>No properties found</div>
              <div style={{ fontSize: 14, color: "#888888" }}>Try adjusting your filters.</div>
              <button type="button" className="rs-btn" onClick={resetFilters}
                style={{ marginTop: 8, background: "#3A2E4F", color: "#D9D9D9", border: "none", borderRadius: 16, padding: "12px 32px", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "box-shadow 0.2s" }}>
                Reset Filters
              </button>
            </div>
          )}

          {filtered.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: "#888888", margin: 0 }}>
                  {`Showing ${visible.length} of ${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
                </p>
                <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                  style={{ height: 36, border: "1px solid #D9D9D9", borderRadius: 8, padding: "0 12px", fontSize: 14, color: "#1E1E1E", background: "#FFFFFF", cursor: "pointer", outline: "none" }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                {uiItems.map(item => (
                  <PropertyCard key={item.id} property={item} testId={`propertyCard-${item.id}`} />
                ))}
              </div>

              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
                  <button type="button" className="lm-btn" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    style={{ background: "#3A2E4F", color: "#D9D9D9", border: "none", borderRadius: 16, padding: "12px 40px", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "box-shadow 0.2s" }}>
                    Load more
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
}
