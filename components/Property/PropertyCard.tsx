"use client";

import Link from "next/link";
import { CARD_FEATURES, shouldRenderFeature, formatFeatureValue } from "@/lib/propertyFeatures";
import { renderImageUrl } from "@/lib/storage/imageUrl";
import FavoriteButton from "@/components/Property/FavoriteButton";

// ── Types ─────────────────────────────────────────────────────────────────────

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
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale:       "For Sale",
  rent:       "For Rent",
  investment: "Investment",
};

type Props = {
  property: CardProperty;
  testId?: string;
};

// ── UI helpers ─────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function PropertyCard({ property, testId }: Props) {
  const {
    id, slug, title, area, price_eur, property_code,
    transaction_type,
    is_golden_visa, is_1choice_deal, featured,
    cover_image_url, gallery_image_urls,
  } = property;

  const transactionLabel = transaction_type
    ? (TRANSACTION_LABELS[transaction_type] ?? null)
    : null;

  // Image: cover_image_url → gallery[0] → null (placeholder), then apply catalog preset
  const rawImage = cover_image_url ?? gallery_image_urls[0] ?? null;
  const displayImage = renderImageUrl(rawImage, "catalog");

  // Badges
  const badges = [
    is_golden_visa   && "Golden Visa",
    is_1choice_deal  && "1ChoiceDeals",
    featured         && "Featured",
  ].filter(Boolean) as string[];

  // Feature icons — card subset only, skip premium group (handled by badges)
  const cardFeatures = CARD_FEATURES.filter(f => f.group !== "premium");
  const visibleFeatures = cardFeatures
    .map(f => ({
      feature: f,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatted: formatFeatureValue(f, (property as any)[f.field]),
    }))
    .filter(({ formatted }) => formatted !== null);

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
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
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
        {badges.length > 0 && (
          <div
            style={{
              position: "absolute", top: 10, left: 10,
              display: "flex", flexWrap: "wrap", gap: 6,
            }}
          >
            {badges.map(label => <Badge key={label} label={label} />)}
          </div>
        )}

        {/* Heart button — top-right; e.preventDefault+stopPropagation inside FavoriteButton */}
        <FavoriteButton propertyId={String(id)} variant="card" />
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
        {/* Property code */}
        {property_code && (
          <div style={{ fontSize: 11, color: "#AAAAAA", fontFamily: "monospace" }}>
            {property_code}
          </div>
        )}

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

        {/* Transaction type */}
        {transactionLabel && (
          <div style={{ fontSize: 11, color: "#888888" }}>{transactionLabel}</div>
        )}

        {/* Feature icons row — hidden when no renderable features */}
        {visibleFeatures.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 4 }}>
            {visibleFeatures.map(({ feature, formatted }) => {
              const Icon = feature.icon;
              return (
                <span
                  key={feature.field}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666666" }}
                >
                  <Icon size={13} strokeWidth={1.8} />
                  {formatted}
                </span>
              );
            })}
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
