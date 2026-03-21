"use client";

import { useState } from "react";
import PropertyCard from "@/components/Property/PropertyCard";

type CardProperty = {
  id: string | number;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  transaction_type?: string | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  featured: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  floor?: number | null;
  year_built?: number | null;
  sea_view?: boolean | null;
  pool?: boolean | null;
  elevator?: boolean | null;
  custom_badge?: string | null;
  custom_badge_color?: string | null;
};

const PAGE_SIZE = 8;

export default function DealsGrid({ deals }: { deals: CardProperty[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = deals.slice(0, visible);
  const hasMore = visible < deals.length;

  if (deals.length === 0) {
    return (
      <p style={{ color: "#888", fontSize: 15, marginTop: 32 }}>
        No deals available at the moment.
      </p>
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32,
        }}
        className="deals-grid"
      >
        {shown.map(p => (
          <PropertyCard
            key={p.id}
            property={p}
            testId={`dealCard-${p.id}`}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
          <button
            type="button"
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            style={{
              height: 48,
              borderRadius: 24,
              border: "1px solid #D9D9D9",
              background: "#FFFFFF",
              color: "#1E1E1E",
              fontSize: 15,
              fontWeight: 500,
              padding: "0 36px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C1121F"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#D9D9D9"; }}
          >
            Load more
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .deals-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .deals-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </>
  );
}
