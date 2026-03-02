import React from "react";

export default function HeroVideo() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute top-0 left-0 z-20 w-full px-12 pt-10 flex items-start justify-between">
        <a href="/" className="block">
          <img
            src="/logo/logo-main.png"
            alt="1Choice"
            className="w-[320px] h-auto"
          />
        </a>

        <nav className="flex gap-10 text-black text-lg font-medium">
          <a href="#deals" className="hover:opacity-70 transition">Deals</a>
          <a href="#golden-visa" className="hover:opacity-70 transition">Golden Visa</a>
          <a href="#contact" className="hover:opacity-70 transition">Contact</a>
        </nav>
      </div>

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
