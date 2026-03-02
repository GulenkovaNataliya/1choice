import React from "react";
import Navbar from "@/components/Navbar";

export default function HeroVideo() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
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

      <Navbar />
    </section>
  );
}
