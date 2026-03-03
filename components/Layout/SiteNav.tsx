"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Properties",                    href: "/properties" },
  { label: "1ChoiceDeals",                  href: "/1choicedeals" },
  { label: "Golden Visa",                   href: "/golden-visa-greece" },
  { label: "Investment & Ownership Guide",  href: "/investment-ownership-guide" },
  { label: "Private Collection",            href: "/private" },
  { label: "About 1Choice",                 href: "/about" },
  { label: "Contact",                       href: "/contact" },
  { label: "Legal",                         href: "/legal" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #D9D9D9",
        width: "100%",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
        }}
      >
        {NAV_ITEMS.map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 14px",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "#3A2E4F" : "#404040",
                textDecoration: "none",
                borderBottom: `2px solid ${active ? "#3A2E4F" : "transparent"}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#3A2E4F"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#404040"; }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
