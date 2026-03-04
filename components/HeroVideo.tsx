"use client";

import { useState, useEffect } from "react";

const DRAWER_LINKS = [
  { label: "Properties", href: "/properties" },
  { label: "1ChoiceDeals", href: "/1choicedeals" },
  { label: "Golden Visa", href: "/golden-visa-greece" },
  { label: "Investment & Ownership Guide", href: "/investment-ownership-guide" },
  { label: "Private Collection", href: "/private" },
  { label: "Legal", href: "/legal" },
];

export default function HeroVideo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false); // controls CSS transition

  function openMenu() {
    setMenuOpen(true);
    // Defer to next frame so transition fires
    requestAnimationFrame(() => setVisible(true));
  }

  function closeMenu() {
    setVisible(false);
    // Wait for transition to finish before unmounting
    setTimeout(() => setMenuOpen(false), 260);
  }

  // ESC closes drawer
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeMenu(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 z-20 w-full px-12 pt-10 flex items-start justify-between">
        <a href="/" className="block">
          <img
            src="/logo/logo-main.png"
            alt="1Choice"
            className="w-[320px] h-auto"
          />
        </a>

        <div className="flex items-center gap-8 text-black text-lg font-medium">
          <a href="/about" className="hover:opacity-70 transition">About 1Choice</a>
          <a href="/contact" className="hover:opacity-70 transition">Contact</a>
          <button
            type="button"
            onClick={openMenu}
            className="hover:opacity-70 transition"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Drawer */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            // Overlay fades in with the panel
            background: visible ? "rgba(30,30,30,0.55)" : "rgba(30,30,30,0)",
            transition: "background 0.26s ease-in-out",
          }}
        >
          {/* Click overlay to close */}
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu overlay"
            style={{
              position: "absolute",
              inset: 0,
              background: "none",
              border: "none",
              cursor: "default",
              width: "100%",
              height: "100%",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: 300,
              background: "transparent",
              backdropFilter: "blur(2px)",
              display: "flex",
              flexDirection: "column",
              padding: "40px 32px",
              transform: visible ? "translateX(0)" : "translateX(100%)",
              opacity: visible ? 1 : 0,
              transition: "transform 0.26s ease-in-out, opacity 0.26s ease-in-out",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 40 }}>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#FFFFFF", fontSize: 26, lineHeight: 1, padding: "0 2px",
                  opacity: 0.85,
                }}
              >
                ×
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {DRAWER_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  style={{
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: 17,
                    fontWeight: 500,
                    opacity: 0.92,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.6"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0.92"; }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Centered text overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.2,
            margin: "0 0 16px",
            textShadow: "0 2px 10px rgba(0,0,0,0.45)",
          }}
        >
          Properties in Greece,<br />Selected Carefully
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "#3A2E4F",
            margin: 0,
            maxWidth: 480,
            background: "rgba(255,255,255,0.75)",
            padding: "6px 12px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          Curated villas, apartments and investment properties across Greece.
        </p>
      </div>

      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/video/hero-1choice.jpg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          zIndex: 0,
        }}
      >
        <source src="/video/hero-1choice.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
