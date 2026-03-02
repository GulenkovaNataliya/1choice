"use client";

import Link from "next/link";

const LINKS = [
  { label: "Properties", href: "/properties", testId: "footerLink-properties" },
  { label: "1ChoiceDeals", href: "/1choicedeals", testId: "footerLink-deals" },
  { label: "Golden Visa", href: "/golden-visa-greece", testId: "footerLink-gv" },
  { label: "About", href: "/about", testId: "footerLink-about" },
  { label: "Contact", href: "/contact", testId: "footerLink-contact" },
  { label: "Legal", href: "/legal", testId: "footerLink-legal" },
];

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#404040",
  textDecoration: "none",
  transition: "color 0.2s",
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-testid="siteFooter"
      style={{
        backgroundColor: "#F4F4F4",
        borderTop: "1px solid #D9D9D9",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 14, color: "#404040" }}>
          © {year} 1Choice Real Estate
        </span>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 20px",
          }}
        >
          {LINKS.map(({ label, href, testId }) => (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              style={linkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#3A2E4F"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#404040"; }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <style>{`
        footer a:focus-visible {
          outline: 2px solid #C1121F;
          outline-offset: 3px;
          border-radius: 3px;
        }
        @media (max-width: 640px) {
          footer > div {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </footer>
  );
}
