import Link from "next/link";

export default function InvestmentGoldenVisaTeaser() {
  return (
    <section
      data-testid="gvTeaserSection"
      style={{ backgroundColor: "#FFFFFF", width: "100%" }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "48px 24px 56px",
        }}
      >
        <div
          style={{
            border: "1px solid #D9D9D9",
            borderRadius: 16,
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
          }}
          className="gv-teaser-inner"
        >
          {/* Text */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#1E1E1E",
                margin: "0 0 12px",
              }}
            >
              Investment &amp; Golden Visa Advisory
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "#404040",
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              Structured guidance for real estate investment and residency by investment options in Greece.
            </p>
          </div>

          {/* CTA */}
          <div style={{ flexShrink: 0 }} className="gv-teaser-cta-wrap">
            <Link
              href="/golden-visa-greece"
              data-testid="gvTeaserCta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                padding: "0 36px",
                backgroundColor: "#1E1E1E",
                color: "#F4F4F4",
                border: "1px solid #404040",
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                transition: "background-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A2E4F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1E1E1E";
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .gv-teaser-cta-wrap a:focus-visible {
          outline: 2px solid #C1121F;
          outline-offset: 3px;
        }
        @media (max-width: 640px) {
          .gv-teaser-inner {
            flex-direction: column !important;
            padding: 28px 24px !important;
          }
          .gv-teaser-cta-wrap {
            width: 100%;
          }
          .gv-teaser-cta-wrap a {
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
