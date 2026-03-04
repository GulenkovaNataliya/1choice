"use client";

import Link from "next/link";

const QUICK_LINKS = [
  {
    label: "Properties",
    desc: "Browse our full catalogue of curated properties across Greece.",
    href: "/properties",
  },
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

export default function QuickLinksGrid() {
  return (
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
  );
}
