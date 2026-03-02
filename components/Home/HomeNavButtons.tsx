"use client";

import Link from "next/link";

const BUTTONS = [
  { label: "Properties", href: "/properties", testId: "navProperties" },
  { label: "1ChoiceDeals", href: "/1choicedeals", testId: "navDeals" },
  { label: "Golden Visa", href: "/golden-visa-greece", testId: "navGoldenVisa" },
  { label: "VIP", href: "/private", testId: "navVip" },
];

export default function HomeNavButtons() {
  return (
    <section style={{ backgroundColor: "#FFFFFF", width: "100%" }}>
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "24px 24px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32,
        }}
        className="home-nav-grid"
      >
        {BUTTONS.map(({ label, href, testId }) => (
          <Link
            key={href}
            href={href}
            data-testid={testId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 72,
              backgroundColor: "#3A2E4F",
              color: "#D9D9D9",
              border: "1px solid #3A2E4F",
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
              textAlign: "center",
              padding: "16px 24px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C1121F";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(193,18,31,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3A2E4F";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .home-nav-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        .home-nav-grid a:focus-visible {
          outline: 2px solid #C1121F;
          outline-offset: 3px;
        }
      `}</style>
    </section>
  );
}
