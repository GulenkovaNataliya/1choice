"use client";

import Link from "next/link";

// Accepts both mockFeatured items (id: string) and MockProperty items (id: number)
type CardProperty = {
  id: string | number;
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
  property: CardProperty;
  testId?: string;
};

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 10px",
        background: "#1E1E1E",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
        color: "#F4F4F4",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function formatPrice(price: number) {
  return "€" + price.toLocaleString("en-EU");
}

export default function PropertyCard({ property, testId }: Props) {
  const {
    id, slug, title, area, price_eur,
    is_golden_visa, is_1choice_deal, cover_image,
    bedrooms, bathrooms, size_sqm,
  } = property;

  // Build specs line — only include truthy values (hides 0-bed land/commercial)
  const specs = [
    bedrooms  ? `${bedrooms} bd`  : null,
    bathrooms ? `${bathrooms} ba` : null,
    size_sqm  ? `${size_sqm} sqm` : null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/properties/${slug}`}
      data-testid={testId ?? `propertyCard-${id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        border: "1px solid #D9D9D9",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image — 4:3 ratio via padding-top 75% */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%",
          background: "#E8E8E8",
          flexShrink: 0,
        }}
      >
        {cover_image ? (
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
              color: "#BBBBBB", fontSize: 13,
            }}
          >
            No image
          </div>
        )}

        {/* Badges — top-left, only when applicable */}
        {(is_golden_visa || is_1choice_deal) && (
          <div
            style={{
              position: "absolute", top: 10, left: 10,
              display: "flex", flexWrap: "wrap", gap: 6,
            }}
          >
            {is_golden_visa  && <Badge label="Golden Visa" />}
            {is_1choice_deal && <Badge label="1ChoiceDeal" />}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "16px 18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexGrow: 1,
        }}
      >
        {/* Title — max 2 lines */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1E1E1E",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {/* Location */}
        <div style={{ fontSize: 13, color: "#404040" }}>{area}</div>

        {/* Key specs — hidden when data absent (e.g. mockFeatured items) */}
        {specs.length > 0 && (
          <div style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>
            {specs.join(" · ")}
          </div>
        )}

        {/* Price */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            fontSize: 17,
            fontWeight: 700,
            color: "#1E1E1E",
          }}
        >
          {price_eur ? formatPrice(price_eur) : "Price on request"}
        </div>
      </div>
    </Link>
  );
}
