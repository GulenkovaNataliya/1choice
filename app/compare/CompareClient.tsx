"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ArrowLeft, GitCompareArrows } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { useCompare } from "@/lib/compare/useCompare";
import { renderImageUrl } from "@/lib/storage/imageUrl";

// ── Layout constants ──────────────────────────────────────────────────────────

const LABEL_W = 140; // px — label column width
const COL_MIN = 190; // px — minimum property column width

// ── Types ─────────────────────────────────────────────────────────────────────

type CompareProperty = {
  id: string;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  transaction_type: string | null;
  category: string | null;
  subtype: string | null;
  size_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  year_built: number | null;
  year_renovated: number | null;
  building_condition: string | null;
  energy_class: string | null;
  elevator: boolean | null;
  fireplace: boolean | null;
  pool: boolean | null;
  garden: boolean | null;
  sea_view: boolean | null;
  mountain_view: boolean | null;
  security_door: boolean | null;
  smart_home: boolean | null;
  frames_type: string | null;
  flooring_type: string | null;
  double_glazing: boolean | null;
  thermal_insulation: boolean | null;
  sound_insulation: boolean | null;
};

// ── Field definitions ─────────────────────────────────────────────────────────

type FieldType = "text" | "bool";

type FieldDef = {
  label: string;
  get: (p: CompareProperty) => unknown;
  type: FieldType;
};

type SectionDef = {
  title: string;
  fields: FieldDef[];
};

// ── Label maps ────────────────────────────────────────────────────────────────

const TX_LABELS: Record<string, string> = {
  sale: "For Sale", rent: "For Rent", investment: "Investment",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "New", excellent: "Excellent", good: "Good",
  needs_renovation: "Needs Renovation", needsrenovation: "Needs Renovation",
  underconstruction: "Under Construction",
};

const FRAMES_LABELS: Record<string, string> = {
  aluminum: "Aluminum", aluminium: "Aluminum", pvc: "PVC",
  synthetic: "Synthetic", wooden: "Wooden", mixed: "Mixed",
};

const FLOORING_LABELS: Record<string, string> = {
  marble: "Marble", tile: "Tile", wooden: "Wooden", wood: "Wood",
  parquet: "Parquet", laminate: "Laminate", granite: "Granite",
  stone: "Stone", cement: "Cement", mixed: "Mixed",
};

function titleCase(s: string | null) {
  if (!s) return null;
  return s.replace(/-/g, " ").split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function mapLabel(map: Record<string, string>, v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return map[v] ?? titleCase(v);
}

// ── Compare sections ──────────────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    title: "Overview",
    fields: [
      { label: "Transaction", get: p => mapLabel(TX_LABELS, p.transaction_type),          type: "text" },
      { label: "Category",    get: p => titleCase(p.category),                             type: "text" },
      { label: "Type",        get: p => titleCase(p.subtype),                              type: "text" },
      { label: "Size",        get: p => p.size_sqm != null ? `${p.size_sqm} m²` : null,   type: "text" },
      { label: "Bedrooms",    get: p => p.bedrooms,                                        type: "text" },
      { label: "Bathrooms",   get: p => p.bathrooms,                                       type: "text" },
      { label: "Floor",       get: p => p.floor,                                           type: "text" },
    ],
  },
  {
    title: "Building",
    fields: [
      { label: "Year built",   get: p => p.year_built,                                              type: "text" },
      { label: "Renovated",    get: p => p.year_renovated,                                         type: "text" },
      { label: "Condition",    get: p => mapLabel(CONDITION_LABELS, p.building_condition),          type: "text" },
      { label: "Energy class", get: p => p.energy_class?.toUpperCase() ?? null,                    type: "text" },
    ],
  },
  {
    title: "Amenities",
    fields: [
      { label: "Elevator",      get: p => p.elevator,      type: "bool" },
      { label: "Fireplace",     get: p => p.fireplace,     type: "bool" },
      { label: "Pool",          get: p => p.pool,          type: "bool" },
      { label: "Garden",        get: p => p.garden,        type: "bool" },
      { label: "Sea view",      get: p => p.sea_view,      type: "bool" },
      { label: "Mountain view", get: p => p.mountain_view, type: "bool" },
      { label: "Security door", get: p => p.security_door, type: "bool" },
      { label: "Smart home",    get: p => p.smart_home,    type: "bool" },
    ],
  },
  {
    title: "Construction",
    fields: [
      { label: "Frames",             get: p => mapLabel(FRAMES_LABELS, p.frames_type),     type: "text" },
      { label: "Flooring",           get: p => mapLabel(FLOORING_LABELS, p.flooring_type), type: "text" },
      { label: "Double glazing",     get: p => p.double_glazing,                           type: "bool" },
      { label: "Thermal insulation", get: p => p.thermal_insulation,                       type: "bool" },
      { label: "Sound insulation",   get: p => p.sound_insulation,                         type: "bool" },
    ],
  },
];

// ── Diff helper ───────────────────────────────────────────────────────────────

/**
 * Normalises a raw field value to a canonical string for equality comparison.
 * null / undefined / "" all map to "" so "no data" is treated as identical.
 */
function canonicalValue(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "";
  if (typeof raw === "boolean") return raw ? "yes" : "no";
  return String(raw);
}

/**
 * Returns true when every property produces the same display value for this
 * field — meaning the row is not a differentiator and can be hidden in diff mode.
 */
function isAllSame(field: FieldDef, props: CompareProperty[]): boolean {
  if (props.length < 2) return true;
  const values = props.map(p => canonicalValue(field.get(p)));
  return values.every(v => v === values[0]);
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

const SELECT_FIELDS =
  "id,property_code,title,slug,price_eur,location,location_text," +
  "cover_image_url,gallery_image_urls," +
  "transaction_type,category,subtype,size_sqm,bedrooms,bathrooms,floor," +
  "year_built,year_renovated,building_condition,energy_class," +
  "elevator,fireplace,pool,garden,sea_view,mountain_view,security_door,smart_home," +
  "frames_type,flooring_type,double_glazing,thermal_insulation,sound_insulation";

function mapRow(p: Record<string, unknown>): CompareProperty {
  const str  = (f: string) => (p[f] as string | null) ?? null;
  const num  = (f: string) => (p[f] as number | null) ?? null;
  const bool = (f: string) => (p[f] as boolean | null) ?? null;

  const rawArea = (str("location_text") ?? str("location") ?? "")
    .replace(/-/g, " ").split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    id:                 str("id")!,
    property_code:      str("property_code"),
    slug:               str("slug")!,
    title:              str("title")!,
    area:               rawArea,
    price_eur:          num("price_eur"),
    cover_image_url:    str("cover_image_url"),
    gallery_image_urls: (p["gallery_image_urls"] as string[] | null) ?? null,
    transaction_type:   str("transaction_type"),
    category:           str("category"),
    subtype:            str("subtype"),
    size_sqm:           num("size_sqm"),
    bedrooms:           num("bedrooms"),
    bathrooms:          num("bathrooms"),
    floor:              num("floor"),
    year_built:         num("year_built"),
    year_renovated:     num("year_renovated"),
    building_condition: str("building_condition"),
    energy_class:       str("energy_class"),
    elevator:           bool("elevator"),
    fireplace:          bool("fireplace"),
    pool:               bool("pool"),
    garden:             bool("garden"),
    sea_view:           bool("sea_view"),
    mountain_view:      bool("mountain_view"),
    security_door:      bool("security_door"),
    smart_home:         bool("smart_home"),
    frames_type:        str("frames_type"),
    flooring_type:      str("flooring_type"),
    double_glazing:     bool("double_glazing"),
    thermal_insulation: bool("thermal_insulation"),
    sound_insulation:   bool("sound_insulation"),
  };
}

// ── CTA helpers ───────────────────────────────────────────────────────────────

type ChatIntent = "viewing_request" | "general_question";

function buildCompareLabel(props: CompareProperty[], intent: ChatIntent): string {
  const base = intent === "viewing_request" ? "Request Viewing" : "Contact Advisor";
  const refs = props
    .slice(0, 3)
    .map(p => p.property_code ?? p.title.slice(0, 24))
    .join(", ");
  return refs ? `${base} — compare: ${refs}` : base;
}

function openCompareChat(props: CompareProperty[], intent: ChatIntent) {
  window.dispatchEvent(
    new CustomEvent("1choice:open-chat", {
      detail: { intent, label: buildCompareLabel(props, intent) },
    })
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return "€" + n.toLocaleString("en-EU");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ValueCell({ value, type }: { value: unknown; type: FieldType }) {
  if (type === "bool") {
    if (value === true)
      return <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 15 }}>✓</span>;
    return <span style={{ color: "#D9D9D9", fontSize: 15 }}>—</span>;
  }
  const text =
    value !== null && value !== undefined && value !== "" ? String(value) : null;
  if (!text) return <span style={{ color: "#D9D9D9" }}>—</span>;
  return <span>{text}</span>;
}

type HeaderCellProps = {
  property: CompareProperty;
  onRemove: () => void;
};

function PropertyHeaderCell({ property, onRemove }: HeaderCellProps) {
  const rawImg = property.cover_image_url ?? property.gallery_image_urls?.[0] ?? null;
  const imgUrl = renderImageUrl(rawImg, "thumb");

  return (
    <div
      style={{
        padding: "14px 12px 16px",
        borderBottom: "2px solid #E8E8E8",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        minWidth: COL_MIN,
      }}
    >
      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${property.title} from compare`}
        style={{
          position: "absolute", top: 10, right: 10,
          width: 24, height: 24, borderRadius: "50%",
          border: "none", background: "#F0F0F0",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}
      >
        <X size={12} color="#888" />
      </button>

      {/* Thumbnail */}
      <div style={{ width: "100%", paddingTop: "66%", position: "relative", borderRadius: 10, overflow: "hidden", background: "#E8E8E8", flexShrink: 0 }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={property.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#BBBBBB", fontSize: 11 }}>
            No image
          </div>
        )}
      </div>

      {property.property_code && (
        <p style={{ fontSize: 10, color: "#AAAAAA", fontFamily: "monospace", margin: 0 }}>
          {property.property_code}
        </p>
      )}
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1E1E1E", margin: 0, lineHeight: 1.35, paddingRight: 20 }}>
        {property.title}
      </p>
      <p style={{ fontSize: 12, color: "#888888", margin: 0 }}>{property.area}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1E1E1E", margin: 0 }}>
        {property.price_eur ? formatPrice(property.price_eur) : "Price on request"}
      </p>
      <Link href={`/properties/${property.slug}`}
        style={{ fontSize: 12, color: "#3A2E4F", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 }}
      >
        View property →
      </Link>
    </div>
  );
}

// ── Empty / loading states ────────────────────────────────────────────────────

function TooFewState() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 flex flex-col items-center gap-5 text-center">
        <GitCompareArrows size={52} strokeWidth={1.2} style={{ color: "#D9D9D9" }} />
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">
            Select at least 2 properties to compare
          </h1>
          <p className="text-[#888888] text-sm max-w-xs leading-relaxed">
            Go to your saved properties and use the Compare toggle on each card.
          </p>
        </div>
        <Link href="/saved"
          className="mt-1 px-6 py-3 rounded-xl bg-[#3A2E4F] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to Saved
        </Link>
      </div>
    </main>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="h-7 w-60 bg-[#F0F0F0] rounded animate-pulse mb-8" />
        <div className="flex gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex-1 rounded-2xl bg-[#F4F4F4] animate-pulse" style={{ height: 280 }} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompareClient() {
  const { ids, isCompared, remove, clear, hydrated } = useCompare();
  const [properties, setProperties]                  = useState<CompareProperty[]>([]);
  const [diffOnly, setDiffOnly]                      = useState(false);
  const fetchedOnce                                  = useRef(false);

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
        setProperties(
          (data ?? []).map(p => mapRow(p as unknown as Record<string, unknown>))
        );
        fetchedOnce.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idsKey]);

  const visible    = properties.filter(p => isCompared(p.id)).slice(0, 3);
  const isLoading  = !hydrated || (ids.length > 0 && !fetchedOnce.current);

  if (isLoading) return <LoadingSkeleton count={ids.length || 2} />;
  if (visible.length < 2) return <TooFewState />;

  const count         = visible.length;
  const totalMinWidth = LABEL_W + count * COL_MIN;

  // fieldIndex only increments for rows that are actually rendered,
  // so alternating backgrounds stay correct when diffOnly filters rows out.
  let fieldIndex = 0;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">

          {/* Row 1: breadcrumb nav + title */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#1E1E1E] transition-colors"
            >
              <ArrowLeft size={14} />
              Saved
            </Link>
            <span className="text-[#D9D9D9] select-none">/</span>
            <h1 className="text-xl font-bold text-[#1E1E1E]">
              Comparing {count} {count === 1 ? "property" : "properties"}
            </h1>
          </div>

          {/* Row 2: diff toggle (left) + actions (right) */}
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Show differences only toggle */}
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            >
              <input
                type="checkbox"
                checked={diffOnly}
                onChange={e => setDiffOnly(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: "#3A2E4F", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: "#404040", fontWeight: 500 }}>
                Show differences only
              </span>
            </label>

            {/* Action buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => clear()}
                style={{
                  padding: "7px 14px", borderRadius: 9,
                  border: "1px solid #D9D9D9", background: "transparent",
                  fontSize: 12, color: "#888888", cursor: "pointer", fontWeight: 500,
                }}
              >
                Clear Compare
              </button>
              <button
                type="button"
                onClick={() => openCompareChat(visible, "viewing_request")}
                style={{
                  padding: "7px 16px", borderRadius: 9,
                  border: "none", background: "#3A2E4F",
                  fontSize: 12, color: "#FFFFFF", cursor: "pointer", fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Request Viewing
              </button>
              <button
                type="button"
                onClick={() => openCompareChat(visible, "general_question")}
                style={{
                  padding: "7px 16px", borderRadius: 9,
                  border: "1px solid #1E1E1E", background: "#FFFFFF",
                  fontSize: 12, color: "#1E1E1E", cursor: "pointer", fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Contact Advisor
              </button>
            </div>
          </div>
        </div>

        {/* ── Compare grid ── */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(${count}, minmax(${COL_MIN}px, 1fr))`,
              minWidth: totalMinWidth,
            }}
          >

            {/* Row 0: empty label + property header cards */}
            <div style={{ borderBottom: "2px solid #E8E8E8" }} />
            {visible.map(p => (
              <PropertyHeaderCell key={p.id} property={p} onRemove={() => remove(p.id)} />
            ))}

            {/* Sections */}
            {SECTIONS.map(section => {
              // In diff mode, only keep fields where at least one value differs
              const renderedFields = diffOnly
                ? section.fields.filter(f => !isAllSame(f, visible))
                : section.fields;

              // Skip the entire section (including its header) if nothing to show
              if (renderedFields.length === 0) return null;

              return (
                <Fragment key={section.title}>

                  {/* Section header — spans all columns */}
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "10px 14px",
                      background: "#F4F4F4",
                      fontSize: 11, fontWeight: 700, color: "#666666",
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      borderBottom: "1px solid #E8E8E8",
                      borderTop: "1px solid #E8E8E8",
                    }}
                  >
                    {section.title}
                  </div>

                  {/* Field rows — only rendered fields */}
                  {renderedFields.map(field => {
                    const rowBg = fieldIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA";
                    fieldIndex++;
                    return (
                      <Fragment key={field.label}>
                        {/* Label cell — sticky on horizontal scroll */}
                        <div
                          style={{
                            position: "sticky", left: 0, zIndex: 1,
                            background: rowBg,
                            padding: "11px 14px", fontSize: 12, color: "#666666",
                            borderBottom: "1px solid #F0F0F0", fontWeight: 500,
                            display: "flex", alignItems: "center",
                          }}
                        >
                          {field.label}
                        </div>

                        {/* Value cells */}
                        {visible.map(p => (
                          <div
                            key={p.id}
                            style={{
                              background: rowBg,
                              padding: "11px 14px", fontSize: 13, color: "#1E1E1E",
                              borderBottom: "1px solid #F0F0F0",
                              display: "flex", alignItems: "center",
                            }}
                          >
                            <ValueCell value={field.get(p)} type={field.type} />
                          </div>
                        ))}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}

          </div>
        </div>

      </div>
    </main>
  );
}
