import Link from "next/link";
import type { Property } from "./mockFeatured";

type Props = {
  property: Property;
  testId?: string;
};

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #D9D9D9",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        color: "#1E1E1E",
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
  const { id, slug, title, area, price_eur, is_golden_visa, is_1choice_deal, cover_image } = property;

  return (
    <Link
      href={`/properties/${slug}`}
      data-testid={testId ?? `featuredCard-${id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        border: "1px solid #D9D9D9",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s, box-shadow 0.2s, border-bottom-color 0.2s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        el.style.borderBottomColor = "#C1121F";
        el.style.borderBottomWidth = "2px";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderBottomColor = "#D9D9D9";
        el.style.borderBottomWidth = "1px";
      }}
    >
      {/* Image / placeholder */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "62%",
          backgroundColor: "#E8E8E8",
          flexShrink: 0,
        }}
      >
        {cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover_image}
            alt={title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#AAAAAA",
              fontSize: 13,
            }}
          >
            No image
          </div>
        )}

        {/* Badges */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <Badge label="Featured" />
          {is_golden_visa && <Badge label="Golden Visa" />}
          {is_1choice_deal && <Badge label="1ChoiceDeal" />}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 6, flexGrow: 1 }}>
        <div style={{ fontSize: 13, color: "#888888" }}>{area}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1E1E1E", lineHeight: 1.3 }}>{title}</div>
        <div style={{ marginTop: "auto", paddingTop: 12, fontSize: 17, fontWeight: 700, color: "#1E1E1E" }}>
          {price_eur ? formatPrice(price_eur) : "Price on request"}
        </div>
      </div>
    </Link>
  );
}
