import Link from "next/link";
import { LOCATION_SEO_CONFIG, LOCATION_SLUGS } from "@/lib/locations/locationSeoConfig";

type Props = {
  title: string;
};

export default function PopularAreaLinks({ title }: Props) {
  return (
    <section style={{ borderTop: "1px solid #E8E8E8" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px" }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#888888",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 16,
          }}
        >
          {title}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {LOCATION_SLUGS.map((slug) => {
            const loc = LOCATION_SEO_CONFIG[slug];
            return (
              <Link
                key={slug}
                href={`/properties/location/${slug}`}
                className="hover:border-[#3A2E4F] hover:text-[#3A2E4F] transition-colors"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  borderRadius: 99,
                  border: "1px solid #D9D9D9",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1E1E1E",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Properties in {loc.name}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
