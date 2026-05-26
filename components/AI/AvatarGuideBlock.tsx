"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type AvatarGuideIntent =
  | "general_question"
  | "golden_visa"
  | "investment_strategy"
  | "property_inquiry";

type AvatarGuideVariant =
  | "home"
  | "golden_visa"
  | "investment_guide"
  | "property_detail";

type Props = {
  variant: AvatarGuideVariant;
  videoSrc: string;
  posterSrc: string;
  intent: AvatarGuideIntent;
  ctaLabel: string;
  title: string;
  body: string;
  className?: string;
};

export default function AvatarGuideBlock({
  variant,
  videoSrc,
  posterSrc,
  intent,
  ctaLabel,
  title,
  body,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canLoadVideo, setCanLoadVideo] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(motionQuery.matches);

    updateMotion();
    motionQuery.addEventListener("change", updateMotion);
    return () => motionQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (!canLoadVideo || reduceMotion) return;
    videoRef.current?.play().catch(() => {
      // Autoplay can be blocked by browser policy; the poster remains visible.
    });
  }, [canLoadVideo, reduceMotion]);

  function openPropertyAdvisor() {
    window.dispatchEvent(
      new CustomEvent("1choice:open-chat", {
        detail: { intent, label: ctaLabel },
      })
    );
  }

  const compact = variant === "property_detail";

  return (
    <section
      ref={rootRef}
      className={[
        compact
          ? "flex flex-col gap-4"
          : "mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-14 md:flex-row md:justify-center md:gap-12 md:py-16",
        className,
      ].join(" ")}
      aria-label="1Choice AI Guide"
    >
      <div
        className={[
          "relative aspect-[9/16] w-full overflow-hidden border border-[#D9D9D9] bg-[#1E1E1E] shadow-[0_18px_45px_rgba(30,30,30,0.14)]",
          compact
            ? "mx-auto max-h-[420px] max-w-[236px] rounded-[22px]"
            : "max-h-[480px] max-w-[300px] rounded-[24px] md:max-w-[340px]",
        ].join(" ")}
      >
        {canLoadVideo && !reduceMotion ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={posterSrc}
            aria-label="1Choice AI Guide video"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={posterSrc}
            alt="1Choice AI Guide"
            fill
            sizes={compact ? "236px" : "(min-width: 768px) 340px, 300px"}
            className="object-cover"
          />
        )}
      </div>

      <div
        className={[
          "flex flex-col",
          compact
            ? "gap-3 text-left"
            : "max-w-xl items-center gap-4 text-center md:items-start md:text-left",
        ].join(" ")}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C1121F]">
          1Choice AI Guide
        </p>
        <h2
          className={[
            "font-bold leading-tight text-[#1E1E1E]",
            compact ? "text-xl" : "text-3xl md:text-4xl",
          ].join(" ")}
        >
          {title}
        </h2>
        <p
          className={[
            "leading-relaxed text-[#1E1E1E]",
            compact ? "text-sm" : "text-base md:text-lg",
          ].join(" ")}
        >
          {body}
        </p>
        <button
          type="button"
          onClick={openPropertyAdvisor}
          className={[
            "inline-flex items-center justify-center rounded-xl bg-[#3A2E4F] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90",
            compact ? "w-full text-sm" : "text-base",
          ].join(" ")}
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
