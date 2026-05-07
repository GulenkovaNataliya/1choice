"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites/useFavorites";

// Hidden on home page (HeroVideo has its own header) and admin panel
const HIDDEN_PATHS = ["/"];
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Golden Visa", href: "/golden-visa-greece" },
  { label: "Investment Guide", href: "/investment-ownership-guide" },
];

export default function PublicHeader() {
  const pathname = usePathname();

  if (
    HIDDEN_PATHS.includes(pathname) ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return <PublicHeaderInner />;
}

function PublicHeaderInner() {
  const pathname = usePathname();
  const { ids: savedIds, hydrated } = useFavorites();
  const savedCount = hydrated ? savedIds.length : 0;
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/properties") return pathname.startsWith("/properties");
    return pathname === href;
  }

  function navLinkStyle(href: string) {
    const active = isActive(href);
    return {
      fontSize: 16,
      fontWeight: active ? 700 : 400,
      color: active ? "#3A2E4F" : "#404040",
      textDecoration: "none",
    };
  }

  const savedActive = pathname === "/saved" || pathname === "/favorites";
  const savedLinkStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 16,
    fontWeight: savedActive ? 700 : 400,
    color: savedActive ? "#3A2E4F" : "#404040",
    textDecoration: "none",
  };
  const savedIcon = (
    <Heart
      size={22}
      style={{
        fill: savedCount > 0 ? "#E53E3E" : "none",
        stroke: savedCount > 0 ? "#E53E3E" : "currentColor",
        flexShrink: 0,
      }}
    />
  );
  const savedBadge = savedCount > 0 && (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 22,
        height: 22,
        padding: "0 6px",
        borderRadius: 11,
        background: "#3A2E4F",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {savedCount}
    </span>
  );

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "#FFFFFF",
        borderBottom: "1px solid #D9D9D9",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "0 24px",
          height: 108,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img
            src="/logo/logo-main.png"
            alt="1Choice"
            style={{ height: "clamp(70px, 8vw, 100px)", width: "auto", display: "block" }}
          />
        </Link>

        {/* Right nav */}
        <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={navLinkStyle(item.href)}>
              {item.label}
            </Link>
          ))}

          <Link
            href="/saved"
            aria-label="Saved properties"
            style={savedLinkStyle}
          >
            {savedIcon}
            <span>Saved</span>
            {savedBadge}
          </Link>
        </nav>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation menu"
          aria-controls="public-header-mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
      </div>

      <nav
        id="public-header-mobile-menu"
        className="mobile-menu"
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={navLinkStyle(item.href)}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/saved"
          aria-label="Saved properties"
          style={savedLinkStyle}
          onClick={() => setMenuOpen(false)}
        >
          {savedIcon}
          <span>Saved</span>
          {savedBadge}
        </Link>
      </nav>

      <style jsx>{`
        .mobile-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          border: 1px solid #d9d9d9;
          border-radius: 10px;
          background: #ffffff;
          color: #404040;
          font-size: 16px;
          font-weight: 600;
          padding: 10px 14px;
        }

        .mobile-menu {
          display: none;
        }

        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }

          .mobile-menu-button {
            display: inline-flex;
          }

          .mobile-menu {
            display: ${menuOpen ? "flex" : "none"};
            flex-direction: column;
            gap: 16px;
            padding: 18px 24px 22px;
            border-top: 1px solid #e8e8e8;
            background: #ffffff;
          }
        }
      `}</style>
    </header>
  );
}
