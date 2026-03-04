"use client";

import { useState } from "react";

const SLOT_COUNT = 5;
const SLOT_BG = ["#E8E8E8", "#DDDDE4", "#E4E0DC", "#DCE4E0", "#E0DCE4"];

type Props = {
  title: string;
  coverUrl: string | null;
  isFeatured?: boolean;
  isGoldenVisa?: boolean;
  is1ChoiceDeal?: boolean;
};

export default function PropertyGalleryClient({
  title,
  coverUrl,
  isFeatured,
  isGoldenVisa,
  is1ChoiceDeal,
}: Props) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Main image — 4:3 */}
      <div
        className="relative w-full rounded-xl overflow-hidden mb-3"
        style={{ paddingTop: "75%", background: SLOT_BG[active] }}
      >
        {coverUrl && active === 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#AAAAAA] text-sm">
            Photo {active + 1}
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
                1Choice
              </span>
            )}
            {isGoldenVisa && (
              <span className="bg-[#1E1E1E] text-[#D4AF37] text-xs font-medium px-3 py-1 rounded-full">
                Golden Visa
              </span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
              active === i ? "border-[#3A2E4F]" : "border-transparent"
            }`}
            style={{ background: SLOT_BG[i] }}
          >
            {coverUrl && i === 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center h-full text-xs text-[#AAAAAA]">
                {i + 1}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
