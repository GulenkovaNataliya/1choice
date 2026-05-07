"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites/useFavorites";

// Hidden on home page (HeroVideo has its own header) and admin panel
const HIDDEN_PATHS = ["/"];

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
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            href="/"
            style={{
              fontSize: 16,
              fontWeight: pathname === "/" ? 700 : 400,
              color: pathname === "/" ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            Home
          </Link>

          <Link
            href="/properties"
            style={{
              fontSize: 16,
              fontWeight: pathname.startsWith("/properties") ? 700 : 400,
              color: pathname.startsWith("/properties") ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            Properties
          </Link>

          <Link
            href="/golden-visa-greece"
            style={{
              fontSize: 16,
              fontWeight: pathname === "/golden-visa-greece" ? 700 : 400,
              color: pathname === "/golden-visa-greece" ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            Golden Visa
          </Link>

          <Link
            href="/investment-ownership-guide"
            style={{
              fontSize: 16,
              fontWeight: pathname === "/investment-ownership-guide" ? 700 : 400,
              color: pathname === "/investment-ownership-guide" ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            Investment Guide
          </Link>

          <Link
            href="/saved"
            aria-label="Saved properties"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 16,
              fontWeight: pathname === "/saved" || pathname === "/favorites" ? 700 : 400,
              color: pathname === "/saved" || pathname === "/favorites" ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            <Heart
              size={22}
              style={{
                fill: savedCount > 0 ? "#E53E3E" : "none",
                stroke: savedCount > 0 ? "#E53E3E" : "currentColor",
                flexShrink: 0,
              }}
            />
            <span>Saved</span>
            {savedCount > 0 && (
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
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
