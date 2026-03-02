import React from "react";

type Props = {
  className?: string;
};

export default function HeroVideo({ className }: Props) {
  return (
    <section
      className={className}
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Background video */}
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
        }}
      >
        <source src="/video/hero-1choice.mp4" type="video/mp4" />
      </video>

      {/* Overlay (делает текст читабельным, без чёрного/белого экрана) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "96px 24px",
          color: "#fff",
        }}
      >
        {/* Логотипы/верхняя полоса (плейсхолдер) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {/* сюда потом вставишь логотип */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
            title="Logo placeholder"
          />
          <div style={{ fontSize: 16, letterSpacing: 0.6, opacity: 0.95 }}>
            1Choice
          </div>
        </div>

        {/* Заголовок / текст */}
        <h1 style={{ fontSize: 44, lineHeight: 1.08, margin: 0, maxWidth: 760 }}>
          Athens Real Estate, curated.
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.5, marginTop: 16, maxWidth: 640, opacity: 0.92 }}>
          One choice at a time — premium properties with clear logic, clean UI, and high trust.
        </p>

        {/* Кнопки (плейсхолдер) */}
        <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
          <a
            href="/catalog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              padding: "0 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.92)",
              color: "#111",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Browse Listings
          </a>
          <a
            href="/golden-visa"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              padding: "0 18px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              fontWeight: 600,
            }}
          >
            Golden Visa
          </a>
        </div>
      </div>
    </section>
  );
}
