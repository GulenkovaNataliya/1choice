"use client";

import { useState } from "react";

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

  return (
    <div>
      {/* Main image — 4:3 */}
      <div
        className="relative w-full rounded-xl overflow-hidden mb-3"
        style={{ paddingTop: "75%", background: "#E8E8E8" }}
      >
        {activeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={`${title} — photo ${active + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
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

        {/* Image counter */}
        {slots.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {active + 1} / {slots.length}
          </div>
        )}
      </div>

      {/* Thumbnails — only when there are multiple images */}
      {slots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slots.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                active === i ? "border-[#3A2E4F]" : "border-transparent"
              }`}
              style={{ background: "#E8E8E8" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
