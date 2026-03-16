"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { renderImageUrl } from "@/lib/storage/imageUrl";

type Props = {
  title: string;
  coverUrl: string | null;
  galleryUrls?: string[];
  isFeatured?: boolean;
  isGoldenVisa?: boolean;
  is1ChoiceDeal?: boolean;
};

export default function PropertyGalleryClient({
  title,
  coverUrl,
  galleryUrls = [],
  isFeatured,
  isGoldenVisa,
  is1ChoiceDeal,
}: Props) {
  // Build ordered slots: cover first, then gallery images (deduplicate cover)
  const slots: string[] = [];
  if (coverUrl) slots.push(coverUrl);
  for (const url of galleryUrls) {
    if (url && url !== coverUrl) slots.push(url);
  }

  const [active, setActive] = useState(0);
  const activeUrl = slots[active] ?? null;
  const total = slots.length;

  const prev = useCallback(() => setActive((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setActive((i) => (i + 1) % total), [total]);

  // Keyboard arrow navigation
  useEffect(() => {
    if (total <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, prev, next]);

  return (
    <div>
      {/* Main image — 4:3 */}
      <div
        className="relative w-full rounded-xl overflow-hidden mb-3"
        style={{ paddingTop: "75%", background: "#E8E8E8" }}
      >
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={`${title} — photo ${active + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 65vw"
            priority={active === 0}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#AAAAAA] text-sm">
            No photo available
          </div>
        )}

        {/* Badges */}
        {(isFeatured || is1ChoiceDeal || isGoldenVisa) && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isFeatured && (
              <span className="bg-[#1E1E1E] text-[#F4F4F4] text-xs font-medium px-3 py-1 rounded-full">
                Featured
              </span>
            )}
            {is1ChoiceDeal && (
              <span className="bg-[#1E1E1E] text-[#C1121F] text-xs font-medium px-3 py-1 rounded-full">
                1ChoiceDeals
              </span>
            )}
            {isGoldenVisa && (
              <span className="bg-[#1E1E1E] text-[#D4AF37] text-xs font-medium px-3 py-1 rounded-full">
                Golden Visa
              </span>
            )}
          </div>
        )}

        {/* Prev / Next arrows — only when there are multiple images */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </>
        )}

        {/* Image counter */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {active + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnails — only when there are multiple images */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slots.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={active === i ? "true" : undefined}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                active === i ? "border-[#3A2E4F]" : "border-transparent hover:border-[#BBBBBB]"
              }`}
              style={{ background: "#E8E8E8" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={renderImageUrl(url, "thumb") ?? url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
