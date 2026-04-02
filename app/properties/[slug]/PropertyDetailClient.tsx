"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Tag, Home, LayoutGrid } from "lucide-react";
import PropertyGalleryClient from "@/components/Property/PropertyGalleryClient";
import PropertyCard from "@/components/Property/PropertyCard";
import PropertyCTAButtons from "@/components/Property/PropertyCTAButtons";
import PropertyShareBlock from "@/components/Property/PropertyShareBlock";
import {
  DETAIL_FEATURES,
  shouldRenderFeature,
  formatFeatureValue,
  type PropertyFeature,
} from "@/lib/propertyFeatures";
import { trackEvent } from "@/lib/analytics";
import {
  TOWN_PLANNING_LABEL,
  LAND_SLOPE_LABEL,
  LAND_FEATURE_LABEL,
} from "@/lib/landPlotOptions";
import FavoriteButton from "@/components/Property/FavoriteButton";
import { getBadgeStyle } from "@/lib/badgeColors";
import dynamic from "next/dynamic";

const ApproximateLocationMap = dynamic(
  () => import("@/components/Property/ApproximateLocationMap"),
  { ssr: false }
);

// ── Types ───────────────────────────────────────────────────────────────────

export type PropertyData = {
  id: string;
  title: string;
  slug: string;
  property_code: string | null;
  price_eur: number | null;
  location: string | null;
  location_text: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  featured: boolean | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  is_golden_visa: boolean | null;
  publish_deals: boolean | null;
  summary: string | null;
  description: string | null;
  youtube_video_url: string | null;
  virtual_tour_url: string | null;
  // Classification
  category: string | null;
  subtype: string | null;
  transaction_type: string | null;
  // Building
  year_built: number | null;
  year_renovated: number | null;
  building_condition: string | null;
  energy_class: string | null;
  heating_type: string | null;
  custom_heating: string | null;
  cooling_type: string | null;
  custom_cooling: string | null;
  heating_system: string | null;
  heating_fuel: string | null;
  heating_features: string[] | null;
  cooling_system: string | null;
  // Layout
  living_rooms: number | null;
  kitchens: number | null;
  storage_rooms: number | null;
  versatile_rooms: number | null;
  wc: number | null;
  furnished: string | null;
  custom_furnished: string | null;
  // Windows & Construction
  frames_type: string | null;
  flooring_type: string | null;
  single_glazing: boolean | null;
  double_glazing: boolean | null;
  triple_glazing: boolean | null;
  mosquito_screens: boolean | null;
  thermal_insulation: boolean | null;
  sound_insulation: boolean | null;
  blinds: boolean | null;
  electric_shutters: boolean | null;
  // Amenities
  fireplace: boolean | null;
  elevator: boolean | null;
  security_door: boolean | null;
  alarm_system: boolean | null;
  video_doorphone: boolean | null;
  smart_home: boolean | null;
  satellite_tv: boolean | null;
  internet_ready: boolean | null;
  wardrobe_room: boolean | null;
  sea_view: boolean | null;
  mountain_view: boolean | null;
  garden: boolean | null;
  pool: boolean | null;
  parking: boolean | null;
  balcony: boolean | null;
  veranda: boolean | null;
  awnings: boolean | null;
  jacuzzi: boolean | null;
  close_to_beaches: boolean | null;
  panoramic_view: boolean | null;
  acropolis_view: boolean | null;
  private_roof_terrace: boolean | null;
  loft: boolean | null;
  internal_staircase: boolean | null;
  barbeque: boolean | null;
  home_cinema: boolean | null;
  smoke_detection: boolean | null;
  // Location
  latitude: number | null;
  longitude: number | null;
  approximate_location: boolean | null;
  address: string | null;
  show_address: boolean | null;
  // Badge
  custom_badge: string | null;
  custom_badge_color: string | null;
  // Land / Plot
  land_area_sqm: number | null;
  building_coefficient: number | null;
  coverage_ratio: number | null;
  frontage_m: number | null;
  remaining_buildable_area_sqm: number | null;
  town_planning_status: string | null;
  land_slope: string | null;
  land_features: string[] | null;
};

type SimilarProperty = {
  id: string;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  featured: boolean;
  private_collection: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  custom_badge?: string | null;
  custom_badge_color?: string | null;
};

type Props = {
  property: PropertyData;
  coverUrl: string | null;
  locationProperties: SimilarProperty[];
  locationPageUrl: string | null;
  similarProperties: SimilarProperty[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return "€" + Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const TRANSACTION_LABELS: Record<string, string> = {
  sale:        "For Sale",
  rent:        "For Rent",
  investment:  "Investment",
  antiparochi: "Antiparochi",
};

function formatTransactionType(value: string | null): string | null {
  if (!value) return null;
  return TRANSACTION_LABELS[value] ?? value;
}

const CONDITION_LABELS: Record<string, string> = {
  new:               "New",
  excellent:         "Excellent",
  good:              "Good",
  needs_renovation:  "Needs Renovation",   // current admin form value
  needsrenovation:   "Needs Renovation",   // legacy (no underscore)
  underconstruction: "Under Construction", // legacy — not in current admin form
};

const FRAMES_LABELS: Record<string, string> = {
  aluminum:  "Aluminum",  // current admin form value
  aluminium: "Aluminum",  // legacy spelling
  pvc:       "PVC",
  synthetic: "Synthetic",
  wooden:    "Wooden",
  mixed:     "Mixed",     // legacy — not in current admin form
};

const FLOORING_LABELS: Record<string, string> = {
  marble:   "Marble",
  tile:     "Tile",
  wooden:   "Wooden",   // current admin form value
  wood:     "Wood",     // legacy spelling
  parquet:  "Parquet",
  laminate: "Laminate",
  granite:  "Granite",
  stone:    "Stone",
  cement:   "Cement",
  mixed:    "Mixed",    // legacy — not in current admin form
};

// Wraps formatFeatureValue with field-specific label overrides
function renderFeatureValue(f: PropertyFeature, value: unknown): string | null {
  if (!shouldRenderFeature(f, value)) return null;
  if (typeof value === "string") {
    if (f.field === "building_condition") return CONDITION_LABELS[value] ?? value;
    if (f.field === "frames_type")        return FRAMES_LABELS[value]    ?? value;
    if (f.field === "flooring_type")      return FLOORING_LABELS[value]  ?? value;
  }
  return formatFeatureValue(f, value);
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-[#404040]">
        <li>
          <Link href="/" className="hover:text-[#3A2E4F] transition">Home</Link>
          <span className="ml-2 text-[#BBBBBB] select-none">/</span>
        </li>
        <li>
          <Link href="/properties" className="hover:text-[#3A2E4F] transition">Properties</Link>
          <span className="ml-2 text-[#BBBBBB] select-none">/</span>
        </li>
        <li className="text-[#404040] truncate max-w-50" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}

// ── Location block — 3 public scenarios ──────────────────────────────────────

function LocationBlock({
  latitude,
  longitude,
  approximate_location,
  show_address,
  areaLabel,
  mapsQuery,
}: {
  latitude: number | null;
  longitude: number | null;
  approximate_location: boolean | null;
  show_address: boolean | null;
  areaLabel: string;
  mapsQuery: string;
}) {
  const hasCoords =
    typeof latitude === "number" &&
    isFinite(latitude) &&
    typeof longitude === "number" &&
    isFinite(longitude);

  // Exact map only when: coords exist, NOT flagged approximate, and NOT explicitly hidden via show_address=false
  // show_address=null is treated as "not hidden" (not explicitly set either way).
  const showExact = hasCoords && !approximate_location && show_address !== false;

  // ── Scenario 1: exact known coordinates ───────────────────────────────────
  if (showExact) {
    const lat = latitude as number;
    const lng = longitude as number;
    const d = 0.005; // ~500 m delta
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return (
      <section className="mt-16">
        <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Location</h2>
        <div className="rounded-2xl overflow-hidden border border-[#E8E8E8]">
          <iframe
            src={osmUrl}
            title="Property location map"
            className="w-full h-64"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[#888888]">{areaLabel}</p>
          <a
            href={`https://maps.google.com?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2 shrink-0 ml-4"
          >
            Open in Google Maps
          </a>
        </div>
      </section>
    );
  }

  // ── Scenario 2: coordinates exist but privacy requires approximate display ─
  //
  // Privacy strategy:
  // 1. NO &marker= in OSM URL — removes the exact pin entirely
  // 2. Deterministic coordinate jitter (~300–500 m) shifts the visible map
  //    center away from the real location; derived from coords so stable
  //    across page loads but opaque to the viewer
  // 3. Visual circle overlay communicates "area shown, not exact address"
  // 4. Google Maps link uses area name only — no raw coordinates
  if (hasCoords) {
    const lat = latitude as number;
    const lng = longitude as number;

    // Deterministic jitter: shifts center ~300–500 m, never exposes exact coords
    const latJitter = ((Math.abs(Math.round(lat * 137)) % 9) - 4) * 0.0009;
    const lngJitter = ((Math.abs(Math.round(lng * 97))  % 7) - 3) * 0.0011;
    const cLat = lat + latJitter;
    const cLng = lng + lngJitter;

    return (
      <section className="mt-16">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Approximate location</h2>
          <span className="text-xs text-[#888888] bg-[#F4F4F4] px-2 py-0.5 rounded-full">
            Approximate
          </span>
        </div>
        <div className="rounded-2xl overflow-hidden border border-[#E8E8E8]">
          <ApproximateLocationMap lat={cLat} lng={cLng} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[#888888]">
            Exact address not publicly disclosed — shown area is approximate
          </p>
          <a
            href={`https://maps.google.com?q=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2 shrink-0"
          >
            Open in Google Maps
          </a>
        </div>
      </section>
    );
  }

  // ── Scenario 3: no coordinates — area reference only ─────────────────────
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Location</h2>
      <div className="bg-[#F4F4F4] rounded-2xl h-64 flex flex-col items-center justify-center gap-4 border border-[#E8E8E8]">
        <MapPin size={32} className="text-[#3A2E4F] opacity-40" />
        <div className="text-center">
          <p className="text-[#404040] text-sm font-medium">{areaLabel}</p>
          <p className="text-[#888888] text-xs mt-1">Area reference only</p>
        </div>
        <a
          href={`https://maps.google.com?q=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2"
        >
          Open in Google Maps
        </a>
      </div>
    </section>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PropertyDetailClient({ property, coverUrl, locationProperties, locationPageUrl, similarProperties }: Props) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (property?.id) {
      trackEvent("property_view", { property_id: property.id });
    }
  }, [property?.id]);

  const {
    title, price_eur, location, location_text, property_code,
    is_golden_visa, publish_deals, featured,
    summary, description, youtube_video_url, virtual_tour_url,
    gallery_image_urls, category, subtype, transaction_type,
  } = property;

  const transactionLabel = formatTransactionType(transaction_type);

  const areaLabel = titleCase(location_text ?? location ?? "");
  const mapsQuery = encodeURIComponent(`${areaLabel}, Greece`);

  // ── Heating / Cooling label maps ─────────────────────────────────────────
  const HEATING_SYSTEM_LABEL: Record<string, string> = {
    central:            "Central Heating",
    central_autonomous: "Central with Autonomy",
    autonomous:         "Autonomous Heating",
    none:               "No Heating",
  };
  const HEATING_FUEL_LABEL: Record<string, string> = {
    oil:         "Oil",
    natural_gas: "Natural Gas",
    electric:    "Electric",
    none:        "None",
  };
  const HEATING_FEATURE_LABEL: Record<string, string> = {
    air_conditioning:   "Air Conditioning",
    heat_pump:          "Heat Pump",
    underfloor:         "Underfloor Heating",
    fan_coil:           "Fan Coil",
    solar_water_heater: "Solar Water Heater",
    storage_heaters:    "Storage Heaters",
  };
  const COOLING_SYSTEM_LABEL: Record<string, string> = {
    central_ac:  "Central AC",
    split_units: "Split Units",
    fan_coil:    "Fan Coil",
    none:        "None",
  };

  // Build derived heating display: system + fuel joined, e.g. "Αυτόνομη θέρμανση / Φυσικό αέριο"
  const heatingSystemLabel = property.heating_system
    ? (HEATING_SYSTEM_LABEL[property.heating_system] ?? property.heating_system)
    : null;
  const heatingFuelLabel =
    property.heating_fuel && property.heating_fuel !== "none"
      ? (HEATING_FUEL_LABEL[property.heating_fuel] ?? property.heating_fuel)
      : null;
  const derivedHeating = [heatingSystemLabel, heatingFuelLabel].filter(Boolean).join(" / ") || null;

  const derivedCooling = property.cooling_system
    ? (COOLING_SYSTEM_LABEL[property.cooling_system] ?? property.cooling_system)
    : null;

  const derivedFeatures = (() => {
    const f = property.heating_features;
    if (!f || f.length === 0) return null;
    return f.map((x) => HEATING_FEATURE_LABEL[x] ?? x).join(", ");
  })();

  // Cast property to a plain record for dynamic DETAIL_FEATURES lookup.
  // Priority: custom_heating/cooling free text → new structured fields → legacy heating_type/cooling_type
  const featureRecord: Record<string, unknown> = {
    ...property,
    heating_type: property.custom_heating?.trim() || derivedHeating || property.heating_type,
    cooling_type: property.custom_cooling?.trim() || derivedCooling || property.cooling_type,
    heating_features: derivedFeatures,
    furnished: property.custom_furnished?.trim() || property.furnished,
  };

  // Group-based feature sets — each only contains renderable fields
  const coreFeatures     = DETAIL_FEATURES.filter(f => f.group === "core"      && shouldRenderFeature(f, featureRecord[f.field]));
  const layoutFeatures   = DETAIL_FEATURES.filter(f => f.group === "layout"    && shouldRenderFeature(f, featureRecord[f.field]));
  const buildingFeatures = DETAIL_FEATURES.filter(f => f.group === "building"  && shouldRenderFeature(f, featureRecord[f.field]));
  const windowsValues    = DETAIL_FEATURES.filter(f => f.group === "windows"   && f.valueType !== "boolean" && shouldRenderFeature(f, featureRecord[f.field]));
  const windowsBools     = DETAIL_FEATURES.filter(f => f.group === "windows"   && f.valueType === "boolean" && shouldRenderFeature(f, featureRecord[f.field]));
  const amenityFeatures  = DETAIL_FEATURES.filter(f => f.group === "amenities" && shouldRenderFeature(f, featureRecord[f.field]));

  const showOverview   = !!(transactionLabel || category || subtype || coreFeatures.length > 0);

  const hasLandPlot = !!(
    property.land_area_sqm ||
    property.building_coefficient ||
    property.coverage_ratio ||
    property.frontage_m ||
    property.remaining_buildable_area_sqm ||
    property.town_planning_status ||
    property.land_slope ||
    (property.land_features && property.land_features.length > 0)
  );

  const hasCharacteristics = showOverview || layoutFeatures.length > 0 || buildingFeatures.length > 0
    || windowsValues.length > 0 || windowsBools.length > 0 || amenityFeatures.length > 0 || hasLandPlot;

  const youtubeId = youtube_video_url ? extractYouTubeId(youtube_video_url) : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">

        {/* Gallery — full width */}
        <PropertyGalleryClient
          title={title}
          coverUrl={coverUrl}
          galleryUrls={Array.isArray(gallery_image_urls) ? gallery_image_urls : []}
          isFeatured={featured ?? false}
          isGoldenVisa={is_golden_visa ?? false}
          is1ChoiceDeal={publish_deals ?? false}
        />

        {/* 2-column layout */}
        <div className="flex flex-col md:flex-row gap-10 mt-10">

          {/* ── LEFT ~65% ── */}
          <div className="w-full md:w-[65%] flex flex-col gap-6">
            <Breadcrumb title={title} />

            {/* Title + property code + badges */}
            <div>
              {property_code && (
                <p className="text-xs text-[#888888] font-mono mb-1">{property_code}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-[#1E1E1E] leading-tight mb-2">
                {title}
              </h1>
              <p className="text-[#3A2E4F] text-sm mb-3">{areaLabel}</p>

              {/* Inline badges */}
              <div className="flex flex-wrap gap-2">
                {featured && (
                  <span className="bg-[#F4F4F4] text-[#1E1E1E] text-xs font-medium px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
                {is_golden_visa && (
                  <span className="bg-[#FFF8E1] text-[#B8860B] text-xs font-medium px-3 py-1 rounded-full">
                    Golden Visa
                  </span>
                )}
                {publish_deals && (
                  <span className="bg-[#FFF0F0] text-[#C1121F] text-xs font-medium px-3 py-1 rounded-full">
                    1ChoiceDeals
                  </span>
                )}
                {property.custom_badge && (
                  <span
                    className="text-xs font-bold tracking-wider px-3 py-1 rounded-full"
                    style={getBadgeStyle(property.custom_badge_color)}
                  >
                    {property.custom_badge}
                  </span>
                )}
              </div>

            </div>

            {/* Price + heart — flex row, price left, heart right */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-bold text-[#1E1E1E]">
                {price_eur ? formatPrice(price_eur) : "Price on request"}
              </p>
              <FavoriteButton propertyId={property.id} variant="detail" />
            </div>

            {/* Summary */}
            {summary && (
              <p className="text-[#404040] text-sm leading-relaxed font-medium whitespace-pre-line">
                {summary}
              </p>
            )}

            {/* Description */}
            {description && (
              <div className="mt-4">
                <div
                  className={
                    descriptionExpanded
                      ? "whitespace-pre-line text-[15px] leading-7 text-[#404040]"
                      : "text-[15px] leading-7 text-[#404040] line-clamp-6"
                  }
                >
                  {description}
                </div>

                {description.length > 350 && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((v) => !v)}
                    className="mt-3 text-sm font-medium text-[#3A2E4F] hover:opacity-80 transition-opacity"
                  >
                    {descriptionExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            {/* Characteristics */}
            {hasCharacteristics && (
              <div className="flex flex-col gap-5">
                <h2 className="text-base font-semibold text-[#1E1E1E]">Characteristics</h2>

                {/* ── Group 1: Property Overview ── */}
                {showOverview && (
                  <div>
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Property Overview
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {transactionLabel && (
                        <Fragment>
                          <span className="flex items-center gap-1.5 text-[#888888]"><Tag size={14} />Transaction</span>
                          <span className="text-[#1E1E1E] font-medium">{transactionLabel}</span>
                        </Fragment>
                      )}
                      {category && (
                        <Fragment>
                          <span className="flex items-center gap-1.5 text-[#888888]"><Home size={14} />Category</span>
                          <span className="text-[#1E1E1E] font-medium">{titleCase(category)}</span>
                        </Fragment>
                      )}
                      {subtype && (
                        <Fragment>
                          <span className="flex items-center gap-1.5 text-[#888888]"><LayoutGrid size={14} />Type</span>
                          <span className="text-[#1E1E1E] font-medium">{titleCase(subtype)}</span>
                        </Fragment>
                      )}
                      {coreFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Fragment key={f.field}>
                            <span className="flex items-center gap-1.5 text-[#888888]"><Icon size={14} />{f.label}</span>
                            <span className="text-[#1E1E1E] font-medium">{renderFeatureValue(f, featureRecord[f.field])}</span>
                          </Fragment>
                        );
                      })}
                      {/* Location always shown in overview */}
                      <span className="flex items-center gap-1.5 text-[#888888]"><MapPin size={14} />Location</span>
                      <span className="text-[#1E1E1E] font-medium">{areaLabel}</span>
                    </div>
                  </div>
                )}

                {/* ── Group 2: Layout & Rooms ── */}
                {layoutFeatures.length > 0 && (
                  <div className="border-t border-[#F0F0F0] pt-5">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Layout & Rooms
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {layoutFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Fragment key={f.field}>
                            <span className="flex items-center gap-1.5 text-[#888888]"><Icon size={14} />{f.label}</span>
                            <span className="text-[#1E1E1E] font-medium">{renderFeatureValue(f, featureRecord[f.field])}</span>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Group 3: Building Information ── */}
                {buildingFeatures.length > 0 && (
                  <div className="border-t border-[#F0F0F0] pt-5">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Building Information
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {buildingFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <Fragment key={f.field}>
                            <span className="flex items-center gap-1.5 text-[#888888]"><Icon size={14} />{f.label}</span>
                            <span className="text-[#1E1E1E] font-medium">{renderFeatureValue(f, featureRecord[f.field])}</span>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Group 4: Windows & Construction ── */}
                {(windowsValues.length > 0 || windowsBools.length > 0) && (
                  <div className="border-t border-[#F0F0F0] pt-5">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Windows & Construction
                    </p>
                    {windowsValues.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-3">
                        {windowsValues.map((f) => {
                          const Icon = f.icon;
                          return (
                            <Fragment key={f.field}>
                              <span className="flex items-center gap-1.5 text-[#888888]"><Icon size={14} />{f.label}</span>
                              <span className="text-[#1E1E1E] font-medium">{renderFeatureValue(f, featureRecord[f.field])}</span>
                            </Fragment>
                          );
                        })}
                      </div>
                    )}
                    {windowsBools.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {windowsBools.map((f) => {
                          const Icon = f.icon;
                          return (
                            <span key={f.field} className="flex items-center gap-1.5 bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full">
                              <Icon size={12} />{f.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Group 5: Comfort & Amenities ── */}
                {amenityFeatures.length > 0 && (
                  <div className="border-t border-[#F0F0F0] pt-5">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Comfort & Amenities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {amenityFeatures.map((f) => {
                        const Icon = f.icon;
                        return (
                          <span key={f.field} className="flex items-center gap-1.5 bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full">
                            <Icon size={12} />{f.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Group 6: Land / Plot ── */}
                {hasLandPlot && (
                  <div className="border-t border-[#F0F0F0] pt-5">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
                      Land / Plot
                    </p>

                    {/* Numeric fields grid */}
                    {(property.land_area_sqm || property.building_coefficient || property.coverage_ratio || property.frontage_m || property.remaining_buildable_area_sqm) && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-3">
                        {property.land_area_sqm != null && (
                          <Fragment>
                            <span className="text-[#888888]">Land Area</span>
                            <span className="text-[#1E1E1E] font-medium">{property.land_area_sqm} m²</span>
                          </Fragment>
                        )}
                        {property.building_coefficient != null && (
                          <Fragment>
                            <span className="text-[#888888]">Building Coefficient</span>
                            <span className="text-[#1E1E1E] font-medium">{property.building_coefficient}</span>
                          </Fragment>
                        )}
                        {property.coverage_ratio != null && (
                          <Fragment>
                            <span className="text-[#888888]">Coverage Ratio</span>
                            <span className="text-[#1E1E1E] font-medium">{property.coverage_ratio}</span>
                          </Fragment>
                        )}
                        {property.frontage_m != null && (
                          <Fragment>
                            <span className="text-[#888888]">Frontage</span>
                            <span className="text-[#1E1E1E] font-medium">{property.frontage_m} m</span>
                          </Fragment>
                        )}
                        {property.remaining_buildable_area_sqm != null && (
                          <Fragment>
                            <span className="text-[#888888]">Remaining Buildable Area</span>
                            <span className="text-[#1E1E1E] font-medium">{property.remaining_buildable_area_sqm} m²</span>
                          </Fragment>
                        )}
                      </div>
                    )}

                    {/* Town Planning Status + Land Slope — inline chips */}
                    {(property.town_planning_status || property.land_slope) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {property.town_planning_status && (
                          <span className="bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full">
                            {TOWN_PLANNING_LABEL[property.town_planning_status] ?? property.town_planning_status}
                          </span>
                        )}
                        {property.land_slope && (
                          <span className="bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full">
                            {LAND_SLOPE_LABEL[property.land_slope] ?? property.land_slope}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Land Features — multi-value chips */}
                    {property.land_features && property.land_features.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {property.land_features.map((feat) => (
                          <span key={feat} className="bg-[#F4F4F4] text-[#404040] text-xs px-3 py-1.5 rounded-full">
                            {LAND_FEATURE_LABEL[feat] ?? feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Media block — YouTube */}
            {youtubeId && (
              <div>
                <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Video Tour</h2>
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Property video tour"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Media block — Virtual tour */}
            {virtual_tour_url && (
              <div>
                <h2 className="text-base font-semibold text-[#1E1E1E] mb-3">Virtual Tour</h2>
                <a
                  href={virtual_tour_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#3A2E4F] text-[#3A2E4F] text-sm font-medium hover:bg-[#F0EDF7] transition-colors"
                >
                  Open Virtual Tour →
                </a>
              </div>
            )}
          </div>

          {/* ── RIGHT ~35% sticky ── */}
          <div className="w-full md:w-[35%]">
            <div className="md:sticky md:top-8 self-start bg-white border border-[#E8E8E8] rounded-2xl p-6 flex flex-col gap-5">
              <p className="hidden md:block text-2xl font-bold text-[#1E1E1E]">
                {price_eur ? formatPrice(price_eur) : "Price on request"}
              </p>

              {/* Quick facts */}
              <div className="flex flex-col gap-2 text-sm text-[#404040] border-b border-[#F0F0F0] pb-5">
                {property.size_sqm    && <span>{property.size_sqm} m²</span>}
                {property.bedrooms    && <span>{property.bedrooms} bedrooms</span>}
                {property.bathrooms   && <span>{property.bathrooms} bathrooms</span>}
                {property.floor       && <span>Floor {property.floor}</span>}
                <span>{areaLabel}</span>
                {property.show_address && property.address
                  ? <span>{property.address}</span>
                  : property.address
                    ? <span className="text-[#888888] text-xs italic">Exact address available upon request.</span>
                    : null
                }
              </div>

              {/* CTAs */}
              <PropertyCTAButtons />

              {/* Share */}
              <PropertyShareBlock
                url={`https://1choice.gr/properties/${property.slug}`}
                title={title}
              />
            </div>
          </div>

        </div>

        {/* Location */}
        <LocationBlock
          latitude={property.latitude}
          longitude={property.longitude}
          approximate_location={property.approximate_location}
          show_address={property.show_address}
          areaLabel={areaLabel}
          mapsQuery={mapsQuery}
        />

        {/* More properties in same area */}
        {locationProperties.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-[#1E1E1E]">
                More properties in {areaLabel}
              </h2>
              {locationPageUrl && (
                <Link
                  href={locationPageUrl}
                  className="text-sm text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {locationProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

        {/* Similar properties — same category + price range */}
        {similarProperties.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-[#1E1E1E] mb-6">Similar properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Mobile-only sticky CTA bar — hidden on md and above */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E8E8] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("1choice:open-chat", {
                detail: { intent: "viewing_request", label: "Request Viewing" },
              })
            );
          }}
          className="w-full py-3 rounded-xl bg-[#3A2E4F] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Request Viewing
        </button>
      </div>

    </main>
  );
}
