"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { mockProperties, type MockProperty } from "@/components/Property/mockProperties";
import PropertyCard from "@/components/Property/PropertyCard";

// ─── Lookup maps ──────────────────────────────────────────────────────────────

const FEATURE_LABEL: Record<string, string> = {
  parking:    "Parking",
  pool:       "Swimming Pool",
  seaview:    "Sea View",
  garden:     "Garden",
  furnished:  "Furnished",
  investment: "Investment Property",
};

const CONDITION_LABEL: Record<string, string> = {
  renovated:          "Renovated",
  needsrenovation:    "Needs Renovation",
  underconstruction:  "Under Construction",
};

// ─── Related selection (pure) ────────────────────────────────────────────────
//
// Scoring per candidate:
//   +4  same transaction type  (strongest signal)
//   +2  same property type
//   +1  same location
// Candidates sorted desc by score; ties keep original array order.
// Current slug is always excluded. Max 4 returned.

function getRelated(
  all: MockProperty[],
  current: MockProperty,
  max = 4,
): MockProperty[] {
  return all
    .filter(p => p.slug !== current.slug)
    .map(p => ({
      property: p,
      score:
        (p.transaction === current.transaction ? 4 : 0) +
        (p.type        === current.type        ? 2 : 0) +
        (p.location    === current.location    ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => s.property);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return "€" + price.toLocaleString("en-EU");
}

const SLOT_BG = ["#E8E8E8", "#DDDDE4", "#E4E0DC", "#DCE4E0", "#E0DCE4"];
const IMAGE_COUNT = 5;

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({
  title,
  cover_image,
}: {
  title: string;
  cover_image: string | null;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Main image — 16:9 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          background: SLOT_BG[active],
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {cover_image && active === 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover_image}
            alt={title}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#AAAAAA", fontSize: 14,
            }}
          >
            Photo {active + 1}
          </div>
        )}
      </div>

      {/* Thumbnail strip — horizontal scroll on overflow */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {Array.from({ length: IMAGE_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            style={{
              flexShrink: 0,
              width: 88,
              height: 60,
              borderRadius: 8,
              border: active === i ? "2px solid #3A2E4F" : "2px solid transparent",
              outline: "none",
              background: SLOT_BG[i],
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              padding: 0,
              transition: "border-color 0.15s",
            }}
          >
            {cover_image && i === 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover_image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 11, color: "#AAAAAA" }}>{i + 1}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Panel ────────────────────────────────────────────────────────────

function ContactPanel() {
  return (
    <div
      style={{
        background: "#F9F9F9",
        border: "1px solid #EBEBEB",
        borderRadius: 16,
        padding: "28px 24px",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E", marginBottom: 20 }}>
        Request Information
      </div>

      <button
        type="button"
        style={{
          width: "100%",
          height: 48,
          borderRadius: 12,
          border: "none",
          background: "#1E1E1E",
          color: "#C1121F",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        Contact Agent
      </button>

      <button
        type="button"
        style={{
          width: "100%",
          height: 48,
          borderRadius: 12,
          border: "none",
          background: "#3A2E4F",
          color: "#D9D9D9",
          fontSize: 15,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Schedule Viewing
      </button>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <li className="bc-item">
          <Link href="/" className="bc-link">Home</Link>
        </li>
        <li className="bc-item">
          <Link href="/properties" className="bc-link">Properties</Link>
        </li>
        <li className="bc-item" aria-current="page" style={{ color: "#404040" }}>
          {title}
        </li>
      </ol>
    </nav>
  );
}

// ─── Client component ─────────────────────────────────────────────────────────

export default function PropertyDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const property = mockProperties.find(p => p.slug === slug);

  // 404 state
  if (!property) {
    return (
      <main style={{ background: "#FFFFFF", minHeight: "100vh" }}>
        <div
          style={{
            maxWidth: 1360, margin: "0 auto", padding: "80px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, color: "#D9D9D9" }}>404</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1E1E1E" }}>
            Property not found
          </div>
          <div style={{ fontSize: 14, color: "#888888" }}>
            This listing may have been removed or the URL is incorrect.
          </div>
          <Link
            href="/properties"
            style={{
              marginTop: 8, color: "#3A2E4F", fontSize: 14,
              fontWeight: 500, textDecoration: "none",
            }}
          >
            ← Back to Properties
          </Link>
        </div>
      </main>
    );
  }

  const {
    title, area, price_eur, cover_image,
    bedrooms, bathrooms, size_sqm, year_built,
    features, condition, is_golden_visa,
    transaction, type,
  } = property;

  const conditionLabel = CONDITION_LABEL[condition] ?? condition;
  const related = getRelated(mockProperties, property);

  const specs = [
    bedrooms   ? { label: "Bedrooms",  value: String(bedrooms) }  : null,
    bathrooms  ? { label: "Bathrooms", value: String(bathrooms) } : null,
    size_sqm   ? { label: "Size",      value: `${size_sqm} sqm` } : null,
    year_built ? { label: "Year",      value: String(year_built) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const descParts = [
    `This ${type} is available for ${transaction === "rent" ? "rent" : "sale"} in ${area}.`,
    specs.length > 0
      ? `It offers ${specs.map(s => s.value + " " + s.label.toLowerCase()).join(", ")}.`
      : "",
    `The property is in ${conditionLabel.toLowerCase()} condition.`,
    is_golden_visa
      ? "It qualifies for the Greek Golden Visa programme, offering residency benefits to eligible non-EU buyers."
      : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style>{`
        .pd-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-top: 36px;
        }
        .pd-sticky { /* normal flow on mobile */ }
        @media (min-width: 768px) {
          .pd-grid {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 48px;
            align-items: start;
          }
          .pd-sticky {
            position: sticky;
            top: 24px;
          }
        }
        .pd-spec-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 20px;
          background: #F4F4F4;
          border-radius: 12px;
          min-width: 80px;
        }
        .pd-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #F4F4F4;
          border-radius: 10px;
          font-size: 14px;
          color: #1E1E1E;
        }
        .pd-sep {
          border: none;
          border-top: 1px solid #F0F0F0;
          margin: 28px 0;
        }
        .bc-item {
          font-size: 13px;
          color: #404040;
        }
        .bc-item:not(:last-child)::after {
          content: "/";
          margin: 0 8px;
          color: #BBBBBB;
          user-select: none;
        }
        .bc-link {
          color: #404040;
          text-decoration: none;
          transition: color 0.15s;
        }
        .bc-link:hover {
          color: #3A2E4F;
        }
        .related-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 640px) {
          .related-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .related-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <main style={{ background: "#FFFFFF", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px 80px" }}>

          <ImageGallery title={title} cover_image={cover_image} />

          <div className="pd-grid">

            {/* ── LEFT COLUMN ── */}
            <div>
              <Breadcrumb title={title} />

              <h1
                style={{
                  fontSize: 28, fontWeight: 700, color: "#1E1E1E",
                  margin: "0 0 8px", lineHeight: 1.3,
                }}
              >
                {title}
              </h1>

              <div style={{ fontSize: 15, color: "#404040", marginBottom: 20 }}>{area}</div>

              <div style={{ fontSize: 28, fontWeight: 700, color: "#1E1E1E", marginBottom: 28 }}>
                {price_eur ? formatPrice(price_eur) : "Price on request"}
              </div>

              {specs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
                  {specs.map(s => (
                    <div key={s.label} className="pd-spec-pill">
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E" }}>{s.value}</span>
                      <span style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>{s.label.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}

              <hr className="pd-sep" />

              <p style={{ fontSize: 15, color: "#404040", lineHeight: 1.75, margin: "0 0 4px" }}>
                {descParts}
              </p>

              {features.length > 0 && (
                <>
                  <hr className="pd-sep" />
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E", marginBottom: 16 }}>
                    Features & Amenities
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {features.map(f => (
                      <div key={f} className="pd-feature">
                        <span style={{ color: "#3A2E4F", fontWeight: 600, fontSize: 15 }}>✓</span>
                        {FEATURE_LABEL[f] ?? f}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <hr className="pd-sep" />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                <div>
                  <div
                    style={{
                      fontSize: 11, color: "#888888", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6,
                    }}
                  >
                    Condition
                  </div>
                  <div style={{ fontSize: 15, color: "#1E1E1E", fontWeight: 500 }}>{conditionLabel}</div>
                </div>

                {is_golden_visa && (
                  <div>
                    <div
                      style={{
                        fontSize: 11, color: "#888888", fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6,
                      }}
                    >
                      Golden Visa
                    </div>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center",
                        background: "#1E1E1E", color: "#F4F4F4",
                        borderRadius: 12, padding: "4px 14px",
                        fontSize: 13, fontWeight: 500,
                      }}
                    >
                      Eligible
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN — sticky on desktop ── */}
            <div>
              <div className="pd-sticky">
                <ContactPanel />
              </div>
            </div>

          </div>

          {/* ── Related Properties ── */}
          {related.length > 0 && (
            <>
              <hr style={{ border: "none", borderTop: "1px solid #F0F0F0", margin: "56px 0 40px" }} />
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1E1E1E", margin: "0 0 28px" }}>
                  Related Properties
                </h2>
                <div className="related-grid">
                  {related.map(p => (
                    <PropertyCard key={p.id} property={p} testId={`related-${p.id}`} />
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </>
  );
}
