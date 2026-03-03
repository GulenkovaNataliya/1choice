import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import HeroVideo from "@/components/HeroVideo";
import PropertyCard from "@/components/Property/PropertyCard";
import Footer from "@/components/Layout/Footer";

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const QUICK_LINKS = [
  {
    label: "1ChoiceDeals",
    desc: "Exclusive curated deals for savvy investors.",
    href: "/1choicedeals",
  },
  {
    label: "Golden Visa",
    desc: "Investment pathways to Greek residency.",
    href: "/golden-visa-greece",
  },
  {
    label: "Investment & Ownership Guide",
    desc: "Everything you need to buy property in Greece.",
    href: "/investment-ownership-guide",
  },
];

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  const supabaseHost = new URL(url).host;

  const { data } = await supabase
    .from("properties")
    .select("id,title,slug,price,location,bedrooms,bathrooms,size,cover_image_path")
    .eq("featured", true)
    .limit(4);

  const featured = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    area: titleCase(p.location),
    price_eur: p.price,
    is_golden_visa: false,
    is_1choice_deal: true,
    cover_image: p.cover_image_path
      ? `https://${supabaseHost}/storage/v1/object/public/property-images/${p.cover_image_path}`
      : null,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size ?? undefined,
  }));

  return (
    <>
      {/* 1. Hero */}
      <HeroVideo />

      {/* 2. Quick Links */}
      <section style={{ background: "#FFFFFF", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {QUICK_LINKS.map(({ label, desc, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "#F4F4F4",
                  borderRadius: 16,
                  padding: "28px 24px",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid transparent",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3A2E4F";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(58,46,79,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1E1E1E" }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, color: "#404040" }}>{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Properties */}
      {featured.length > 0 && (
        <section style={{ background: "#F4F4F4", padding: "64px 24px" }}>
          <div style={{ maxWidth: 1360, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 32,
              }}
            >
              <h2
                style={{ fontSize: 26, fontWeight: 700, color: "#1E1E1E", margin: 0 }}
              >
                Featured Properties
              </h2>
              <Link
                href="/properties"
                style={{
                  fontSize: 14,
                  color: "#3A2E4F",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {featured.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Private Collection teaser */}
      <section style={{ background: "#3A2E4F", padding: "64px 24px" }}>
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          <h2
            style={{ fontSize: 26, fontWeight: 700, color: "#D9D9D9", margin: 0 }}
          >
            Private Collection
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(217,217,217,0.82)",
              maxWidth: 520,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Unlisted properties for select clients. Request access to our
            off-market portfolio.
          </p>
          <Link
            href="/private"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#D9D9D9",
              color: "#3A2E4F",
              padding: "12px 28px",
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Private Collection
          </Link>
        </div>
      </section>

      {/* 5. About teaser */}
      <section style={{ background: "#FFFFFF", padding: "64px 24px" }}>
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          <h2
            style={{ fontSize: 26, fontWeight: 700, color: "#1E1E1E", margin: 0 }}
          >
            About 1Choice
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#404040",
              maxWidth: 520,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            We select properties so you don&apos;t have to. A boutique real estate
            service focused on quality over quantity.
          </p>
          <Link
            href="/about"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#1E1E1E",
              color: "#D9D9D9",
              padding: "12px 28px",
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* 6. Footer */}
      <Footer />
    </>
  );
}
