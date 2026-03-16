"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites/useFavorites";
import { useCompare } from "@/lib/compare/useCompare";

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

// ── Count badge ───────────────────────────────────────────────────────────────

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 9,
        background: "#3A2E4F",
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: 700,
        marginLeft: 5,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {count}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SiteNav() {
  const pathname = usePathname();

  // Hooks read from localStorage after mount via SYNC_EVENT pattern.
  // Before hydration both counts are 0 — badges simply stay hidden until mount.
  const { ids: savedIds, hydrated: savedHydrated }       = useFavorites();
  const { count: compareCount, hydrated: compareHydrated } = useCompare();

  const savedCount = savedHydrated   ? savedIds.length : 0;
  const cmpCount   = compareHydrated ? compareCount    : 0;

  const DYNAMIC_ITEMS = [
    { label: "Saved",   href: "/saved",    count: savedCount },
    { label: "Compare", href: "/compare",  count: cmpCount   },
  ];

  // Shared link style factory — identical treatment for all items
  function linkStyle(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "12px 14px",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? "#3A2E4F" : "#404040",
      textDecoration: "none",
      borderBottom: `2px solid ${active ? "#3A2E4F" : "transparent"}`,
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
      transition: "color 0.15s",
    };
  }

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
        {/* Static nav items */}
        {NAV_ITEMS.map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={linkStyle(href)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#3A2E4F"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#404040"; }}
            >
              {label}
            </Link>
          );
        })}

        {/* Thin separator */}
        <div
          aria-hidden="true"
          style={{
            width: 1,
            background: "#E8E8E8",
            margin: "8px 6px",
            flexShrink: 0,
          }}
        />

        {/* Dynamic: Saved + Compare with count badges */}
        {DYNAMIC_ITEMS.map(({ label, href, count }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={linkStyle(href)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#3A2E4F"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#404040"; }}
            >
              {label}
              <CountBadge count={count} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
