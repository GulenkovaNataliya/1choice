import Link from "next/link";
import { mockFeatured } from "@/components/Property/mockFeatured";
import PropertyCard from "@/components/Property/PropertyCard";

const LIMIT = 4;

export default function FeaturedProperties() {
  const items = mockFeatured.filter((p) => !p.is_vip).slice(0, LIMIT);

  return (
    <section
      data-testid="featuredSection"
      style={{ backgroundColor: "#F4F4F4", width: "100%" }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "40px 24px 48px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1E1E1E",
            margin: "0 0 32px",
          }}
        >
          Featured Properties
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
          }}
          className="featured-grid"
        >
          {items.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              testId={`featuredCard-${property.id}`}
            />
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link
            href="/properties"
            data-testid="viewAllPropertiesLink"
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#1E1E1E",
              textDecoration: "none",
              borderBottom: "1px solid #1E1E1E",
              paddingBottom: 2,
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#3A2E4F";
              e.currentTarget.style.borderBottomColor = "#3A2E4F";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#1E1E1E";
              e.currentTarget.style.borderBottomColor = "#1E1E1E";
            }}
          >
            View all properties
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .featured-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
