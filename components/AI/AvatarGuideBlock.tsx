"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import KeyIcon from "@/components/icons/KeyIcon";

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
  const hasStartedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const [canLoadVideo, setCanLoadVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ensure video is paused when component unmounts (navigation or removal)
  useEffect(() => {
    const vid = videoRef.current;
    return () => {
      try {
        vid?.pause();
      } catch {
        // ignore
      }
      setIsPlaying(false);
    };
  }, []);

  useEffect(() => {
    if (!canLoadVideo || !isPlaying) return;
    const video = videoRef.current;
    if (!video) return;

    if (!hasStartedRef.current || hasEndedRef.current) {
      try {
        video.currentTime = 0;
      } catch {
        // Some browsers wait for metadata before seeking; playback still starts from the beginning on first load.
      }
    }

    hasEndedRef.current = false;
    video.muted = false;
    video.volume = 1;
    video
      .play()
      .then(() => {
        hasStartedRef.current = true;
      })
      .catch(() => {
        setIsPlaying(false);
      });
  }, [canLoadVideo, isPlaying]);

  function toggleGuideVideo() {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setCanLoadVideo(true);
    setIsPlaying(true);
  }

  function handleVideoEnded() {
    hasEndedRef.current = true;
    setIsPlaying(false);
  }

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
        {canLoadVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            preload="none"
            poster={posterSrc}
            aria-label="1Choice AI Guide video"
            onEnded={handleVideoEnded}
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
        <div className="absolute inset-x-4 bottom-4 flex justify-center">
          <button
            type="button"
            onClick={toggleGuideVideo}
            className="rounded-xl bg-[#3A2E4F] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          >
            {isPlaying ? "Pause" : "Play 1Choice AI Guide"}
          </button>
        </div>
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
          <span className="flex items-center justify-center gap-2.5">
            <KeyIcon className="h-4 w-auto" />
            <span>{ctaLabel}</span>
          </span>
        </button>
      </div>
    </section>
  );
}
