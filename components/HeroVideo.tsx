"use client";

import { useState } from "react";

export default function HeroVideo() {
  const [menuOpen, setMenuOpen] = useState(false);

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
            onClick={() => setMenuOpen(true)}
            className="hover:opacity-70 transition"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Drawer */}
      {menuOpen && (
        <div className="absolute inset-0 z-30">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/10"
            aria-label="Close menu overlay"
          />
          <div className="absolute top-0 right-0 h-full w-[360px] bg-white/95 backdrop-blur p-10 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-black text-xl font-semibold">1Choice</div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-black text-2xl"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="mt-10 flex flex-col gap-5 text-black text-lg">
              <a href="/properties" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Properties</a>
              <a href="/1choicedeals" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">1ChoiceDeals</a>
              <a href="/golden-visa-greece" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Golden Visa</a>
              <a href="/investment-ownership-guide" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Investment & Ownership Guide</a>
              <a href="/private" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Private Collection</a>
              <a href="/about" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">About 1Choice</a>
              <a href="/contact" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Contact</a>
              <a href="/legal" onClick={() => setMenuOpen(false)} className="hover:opacity-70 transition">Legal</a>
            </nav>
          </div>
        </div>
      )}

      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/video/hero-1choice.jpg"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/hero-1choice.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
