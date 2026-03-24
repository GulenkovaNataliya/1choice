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
          width: 44,
          height: 44,
          borderRadius: 10,
          border: "none",
          background: saved ? "#C1121F" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          transition: "transform 0.15s, background 0.15s",
          visibility: hydrated ? "visible" : "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <Heart
          size={22}
          fill={saved ? "#FFFFFF" : "none"}
          color={saved ? "#FFFFFF" : "#C1121F"}
          strokeWidth={2}
        />
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
