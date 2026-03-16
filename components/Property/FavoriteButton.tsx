"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites/useFavorites";

type Props = {
  propertyId: string;
  /**
   * "card"   — small circular overlay button (top-right of card image)
   * "detail" — inline pill button (property detail page)
   */
  variant?: "card" | "detail";
};

export default function FavoriteButton({ propertyId, variant = "card" }: Props) {
  const { isSaved, toggle, hydrated } = useFavorites();
  const saved = isSaved(propertyId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(propertyId);
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={saved ? "Remove from saved" : "Save property"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 999,
          border: saved ? "1.5px solid #C1121F" : "1.5px solid #D9D9D9",
          background: saved ? "#FFF0F0" : "#FFFFFF",
          color: saved ? "#C1121F" : "#888888",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s",
          // hidden until hydrated to prevent flash of wrong state
          visibility: hydrated ? "visible" : "hidden",
        }}
      >
        <Heart
          size={14}
          fill={saved ? "#C1121F" : "none"}
          color={saved ? "#C1121F" : "#888888"}
          strokeWidth={1.8}
        />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  // card variant — small circle overlay, top-right of image
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from saved" : "Save property"}
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        transition: "transform 0.15s",
        // hidden until hydrated to prevent flash of wrong state
        visibility: hydrated ? "visible" : "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <Heart
        size={16}
        fill={saved ? "#C1121F" : "none"}
        color={saved ? "#C1121F" : "#1E1E1E"}
        strokeWidth={1.8}
      />
    </button>
  );
}
