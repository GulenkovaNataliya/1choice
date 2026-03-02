import React from "react";

type Props = {
  className?: string;
};

export default function HeroVideo({ className }: Props) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
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

      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex h-full items-center justify-center">
        <img
          src="/logo/logo-main.png"
          alt="1Choice"
          className="w-64 md:w-80"
        />
      </div>
    </section>
  );
}
