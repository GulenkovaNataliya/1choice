"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/storage/publicImageUrl";

// ─── Type ─────────────────────────────────────────────────────────────────────

type Property = {
  id: string;
  title: string;
  slug: string;
  price: number;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  featured: boolean | null;
  cover_image_path: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return "€" + price.toLocaleString("en-EU");
}

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SLOT_BG = ["#E8E8E8", "#DDDDE4", "#E4E0DC", "#DCE4E0", "#E0DCE4"];
const IMAGE_COUNT = 5;

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ title, coverUrl }: { title: string; coverUrl: string | null }) {
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
        {coverUrl && active === 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
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

      {/* Thumbnail strip */}
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
              padding: 0,
              transition: "border-color 0.15s",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {coverUrl && i === 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
          width: "100%", height: 48, borderRadius: 12, border: "none",
          background: "#1E1E1E", color: "#C1121F",
          fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12,
        }}
      >
        Contact Agent
      </button>

      <button
        type="button"
        style={{
          width: "100%", height: 48, borderRadius: 12, border: "none",
          background: "#3A2E4F", color: "#D9D9D9",
          fontSize: 15, fontWeight: 500, cursor: "pointer",
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
          listStyle: "none", margin: 0, padding: 0,
          display: "flex", flexWrap: "wrap", alignItems: "center",
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

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("slug", slug)
        .single();

      setProperty(data);
      setLoading(false);
    };

    load();
  }, [slug]);

  if (loading) return null;

  // 404 state
  if (!property) {
    return (
      <main style={{ background: "#FFFFFF", minHeight: "100vh" }}>
        <div
          style={{
            maxWidth: 1360, margin: "0 auto", padding: "80px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, textAlign: "center",
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
              marginTop: 8, color: "#3A2E4F",
              fontSize: 14, fontWeight: 500, textDecoration: "none",
            }}
          >
            ← Back to Properties
          </Link>
        </div>
      </main>
    );
  }

  const { title, price, location, bedrooms, bathrooms, size, cover_image_path } = property;
  const areaLabel = titleCase(location);
  const coverUrl = cover_image_path ? publicImageUrl(cover_image_path) : null;

  const specs = [
    bedrooms  ? { label: "Bedrooms",  value: String(bedrooms) }  : null,
    bathrooms ? { label: "Bathrooms", value: String(bathrooms) } : null,
    size      ? { label: "Size",      value: `${size} sqm` }     : null,
  ].filter(Boolean) as { label: string; value: string }[];

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
        .pd-sep {
          border: none;
          border-top: 1px solid #F0F0F0;
          margin: 28px 0;
        }
        .bc-item { font-size: 13px; color: #404040; }
        .bc-item:not(:last-child)::after {
          content: "/";
          margin: 0 8px;
          color: #BBBBBB;
          user-select: none;
        }
        .bc-link { color: #404040; text-decoration: none; transition: color 0.15s; }
        .bc-link:hover { color: #3A2E4F; }
      `}</style>

      <main style={{ background: "#FFFFFF", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px 80px" }}>

          <ImageGallery title={title} coverUrl={coverUrl} />

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

              <div style={{ fontSize: 15, color: "#404040", marginBottom: 20 }}>
                {areaLabel}
              </div>

              <div style={{ fontSize: 28, fontWeight: 700, color: "#1E1E1E", marginBottom: 28 }}>
                {price ? formatPrice(price) : "Price on request"}
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
            </div>

            {/* ── RIGHT COLUMN — sticky on desktop ── */}
            <div>
              <div className="pd-sticky">
                <ContactPanel />
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
