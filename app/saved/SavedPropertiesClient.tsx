"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, GitCompareArrows } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { useFavorites } from "@/lib/favorites/useFavorites";
import { useCompare, COMPARE_MAX } from "@/lib/compare/useCompare";
import PropertyCard from "@/components/Property/PropertyCard";

// ── Types ─────────────────────────────────────────────────────────────────────

type CardProperty = {
  id: string;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  transaction_type: string | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  featured: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  year_built: number | null;
  sea_view: boolean | null;
  pool: boolean | null;
  elevator: boolean | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const SELECT_FIELDS =
  "id,property_code,title,slug,price_eur,location,location_text," +
  "bedrooms,bathrooms,size_sqm,floor,year_built,featured," +
  "is_golden_visa,publish_deals,sea_view,pool,elevator," +
  "transaction_type,cover_image_url,gallery_image_urls";

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapRow(p: Record<string, unknown>): CardProperty {
  return {
    id: p.id as string,
    property_code: (p.property_code as string | null) ?? null,
    slug: p.slug as string,
    title: p.title as string,
    area: titleCase(
      (p.location_text as string | null) ?? (p.location as string | null) ?? ""
    ),
    price_eur: (p.price_eur as number | null) ?? null,
    transaction_type: (p.transaction_type as string | null) ?? null,
    is_golden_visa: (p.is_golden_visa as boolean | null) ?? false,
    is_1choice_deal: (p.publish_deals as boolean | null) ?? false,
    featured: (p.featured as boolean | null) ?? false,
    cover_image_url: (p.cover_image_url as string | null) ?? null,
    gallery_image_urls: (p.gallery_image_urls as string[] | null) ?? [],
    bedrooms: (p.bedrooms as number | null) ?? null,
    bathrooms: (p.bathrooms as number | null) ?? null,
    size_sqm: (p.size_sqm as number | null) ?? null,
    floor: (p.floor as number | null) ?? null,
    year_built: (p.year_built as number | null) ?? null,
    sea_view: (p.sea_view as boolean | null) ?? null,
    pool: (p.pool as boolean | null) ?? null,
    elevator: (p.elevator as boolean | null) ?? null,
  };
}

// ── Shortlist CTA helpers ─────────────────────────────────────────────────────

type ChatIntent = "viewing_request" | "general_question";

function buildShortlistLabel(props: CardProperty[], intent: ChatIntent): string {
  const base = intent === "viewing_request" ? "Request Viewing" : "Contact Advisor";
  const refs = props
    .slice(0, 5)
    .map(p => p.property_code ?? p.title.slice(0, 24))
    .join(", ");
  return refs ? `${base} — shortlist: ${refs}` : base;
}

function openChat(props: CardProperty[], intent: ChatIntent) {
  window.dispatchEvent(
    new CustomEvent("1choice:open-chat", {
      detail: { intent, label: buildShortlistLabel(props, intent) },
    })
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SavedSummaryBar({ properties }: { properties: CardProperty[] }) {
  const count = properties.length;
  return (
    <div className="mb-8 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-base font-semibold text-[#1E1E1E]">
          You saved {count} {count === 1 ? "property" : "properties"}
        </p>
        <p className="text-sm text-[#888888] mt-0.5">
          Review your shortlist and speak with an advisor to arrange viewings.
        </p>
      </div>

      <div className="flex gap-3 shrink-0">
        <button
          type="button"
          onClick={() => openChat(properties, "viewing_request")}
          className="px-5 py-2.5 rounded-xl bg-[#3A2E4F] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Request Viewing
        </button>
        <button
          type="button"
          onClick={() => openChat(properties, "general_question")}
          className="px-5 py-2.5 rounded-xl border border-[#1E1E1E] text-[#1E1E1E] bg-white text-sm font-medium hover:bg-[#F4F4F4] transition-colors whitespace-nowrap"
        >
          Contact Advisor
        </button>
      </div>
    </div>
  );
}

// ── Compare toggle button — only rendered on /saved ───────────────────────────

type CompareToggleProps = {
  propertyId: string;
  title: string;
  compared: boolean;
  atLimit: boolean;
  onToggle: () => void;
};

function CompareToggleButton({ propertyId: _propertyId, title, compared, atLimit, onToggle }: CompareToggleProps) {
  const blocked = !compared && atLimit;

  return (
    <button
      type="button"
      onClick={blocked ? undefined : onToggle}
      disabled={blocked}
      aria-label={compared ? `Remove ${title} from compare` : `Add ${title} to compare`}
      title={blocked ? `Maximum ${COMPARE_MAX} properties can be compared` : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        padding: "7px 0",
        borderRadius: 10,
        border: compared
          ? "1.5px solid #3A2E4F"
          : "1.5px dashed #D9D9D9",
        background: compared ? "#3A2E4F" : "transparent",
        color: compared ? "#FFFFFF" : blocked ? "#CCCCCC" : "#888888",
        fontSize: 12,
        fontWeight: 500,
        cursor: blocked ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: blocked ? 0.5 : 1,
      }}
    >
      <GitCompareArrows size={13} strokeWidth={1.8} />
      {compared
        ? "Comparing"
        : blocked
          ? `Compare (max ${COMPARE_MAX})`
          : "Compare"}
    </button>
  );
}

// ── Compare bar — fixed bottom, visible when comparingVisible.length >= 2 ─────

type CompareBarProps = {
  count: number;
  onClear: () => void;
};

function CompareBar({ count, onClear }: CompareBarProps) {
  if (count < 2) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "#1E1E1E",
        borderTop: "1px solid #333",
      }}
    >
      <div
        style={{
          maxWidth: 896,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Left: icon + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GitCompareArrows size={16} color="#AAAAAA" strokeWidth={1.8} />
          <span style={{ color: "#F4F4F4", fontSize: 14, fontWeight: 600 }}>
            Compare {count} {count === 1 ? "property" : "properties"}
          </span>
        </div>

        {/* Right: clear + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear compare selection"
            style={{
              background: "transparent",
              border: "none",
              color: "#888888",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            Clear
          </button>
          <Link
            href="/compare"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 18px",
              borderRadius: 10,
              background: "#FFFFFF",
              color: "#1E1E1E",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Compare →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Loading / empty ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="h-8 w-52 bg-[#F0F0F0] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-28 bg-[#F0F0F0] rounded animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl bg-[#F4F4F4] animate-pulse" style={{ height: 320 }} />
          ))}
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 flex flex-col items-center gap-5 text-center">
        <Heart size={52} strokeWidth={1.2} style={{ color: "#D9D9D9" }} />
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">
            No saved properties yet
          </h1>
          <p className="text-[#888888] text-sm max-w-xs leading-relaxed">
            Browse listings and tap the heart icon to save properties you like.
          </p>
        </div>
        <Link
          href="/properties"
          className="mt-1 px-6 py-3 rounded-xl bg-[#3A2E4F] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Browse Properties
        </Link>
      </div>
    </main>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SavedPropertiesClient() {
  const { ids, isSaved, hydrated }              = useFavorites();
  const { isCompared, toggle, atLimit, clear }  = useCompare();
  const [properties, setProperties]             = useState<CardProperty[]>([]);
  const fetchedOnce                             = useRef(false);

  const idsKey = ids.join(",");

  useEffect(() => {
    if (!hydrated) return;

    if (ids.length === 0) {
      setProperties([]);
      fetchedOnce.current = true;
      return;
    }

    const supabase = getSupabase();
    supabase
      .from("properties")
      .select(SELECT_FIELDS)
      .in("id", ids)
      .eq("status", "published")
      .eq("publish_1choice", true)
      .eq("private_collection", false)
      .then(({ data }) => {
        setProperties((data ?? []).map(p => mapRow(p as unknown as Record<string, unknown>)));
        fetchedOnce.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idsKey]);

  // visible = saved properties that are public (filtered from fetch result by live isSaved)
  const visible = properties.filter(p => isSaved(p.id));

  // comparingVisible = only the cards currently shown AND selected for compare.
  // This is the authoritative count used in CompareBar — stale/unsaved ids in
  // compare storage are automatically excluded here, keeping UI consistent.
  const comparingVisible = visible.filter(p => isCompared(p.id));
  const compareCount     = comparingVisible.length;

  const isLoading = !hydrated || (ids.length > 0 && !fetchedOnce.current);

  if (isLoading) return <LoadingSkeleton />;
  if (visible.length === 0) return <EmptyState />;

  return (
    <>
      <main
        className="min-h-screen bg-white"
        // Extra bottom padding when compare bar is visible so content isn't obscured
        style={{ paddingBottom: compareCount >= 2 ? 72 : 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] mb-6">
            Saved Properties
          </h1>

          <SavedSummaryBar properties={visible} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visible.map(p => (
              // Card wrapper: PropertyCard + compare toggle below.
              // This keeps PropertyCard itself untouched globally.
              <div key={p.id} className="flex flex-col gap-2">
                <PropertyCard property={p} />
                <CompareToggleButton
                  propertyId={p.id}
                  title={p.title}
                  compared={isCompared(p.id)}
                  atLimit={atLimit}
                  onToggle={() => toggle(p.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Compare bar — driven by comparingVisible so stale compare IDs never inflate the count */}
      <CompareBar count={compareCount} onClear={clear} />
    </>
  );
}
