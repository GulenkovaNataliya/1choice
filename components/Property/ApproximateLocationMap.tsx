"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Jittered latitude — map center and circle anchor (not the real property coords) */
  lat: number;
  /** Jittered longitude — map center and circle anchor (not the real property coords) */
  lng: number;
}

export default function ApproximateLocationMap({ lat, lng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import avoids SSR / window-is-not-defined errors
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // CSS — injected once via a <link> so it doesn't block SSR
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Geo-anchored circle — moves with the map during pan/zoom
      L.circle([lat, lng], {
        radius: 600,          // ~600 m, wide enough to obscure exact location
        color: "#3A2E4F",
        fillColor: "#3A2E4F",
        fillOpacity: 0.10,
        weight: 2,
        opacity: 0.50,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // lat/lng are deterministic jitter values derived from static coords — stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="w-full h-64" />;
}
