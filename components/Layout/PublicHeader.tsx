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
          height: 72,
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
            style={{ height: "clamp(40px, 5vw, 56px)", width: "auto", display: "block" }}
          />
        </Link>

        {/* Right nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/properties"
            style={{
              fontSize: 13,
              fontWeight: pathname.startsWith("/properties") ? 600 : 400,
              color: pathname.startsWith("/properties") ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            Properties
          </Link>

          <Link
            href="/favorites"
            aria-label="Saved properties"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              fontWeight: pathname === "/favorites" ? 600 : 400,
              color: pathname === "/favorites" ? "#3A2E4F" : "#404040",
              textDecoration: "none",
            }}
          >
            <Heart
              size={16}
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
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 9,
                  background: "#3A2E4F",
                  color: "#FFFFFF",
                  fontSize: 10,
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
