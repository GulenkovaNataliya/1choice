/**
 * Property Feature Mapping — single source of truth for all renderable property fields.
 *
 * Rules:
 *   - boolean fields render only if value is true
 *   - number fields render only if value is a finite number (not null/undefined/0 treated as falsy)
 *   - string fields render only if value is a non-empty string
 *   - showOnCard  = eligible for compact property card (keep this list short)
 *   - showOnDetail = eligible for full detail page
 */

import type { LucideIcon } from "lucide-react";
import {
  Ruler,
  BedDouble,
  Bath,
  Layers,
  CalendarDays,
  Zap,
  Sofa,
  UtensilsCrossed,
  Package,
  DropletOff,
  Wrench,
  AppWindow,
  Sparkles,
  Layers2,
  Thermometer,
  Volume2,
  Flame,
  ArrowUp,
  ShieldCheck,
  Bell,
  Video,
  Cpu,
  Tv2,
  Wifi,
  Archive,
  Waves,
  Mountain,
  Trees,
  Droplets,
  Star,
  Lock,
  BadgeCheck,
} from "lucide-react";

// ── Value types ───────────────────────────────────────────────────────────────

export type FeatureValueType = "boolean" | "number" | "string";

// ── Feature definition ────────────────────────────────────────────────────────

export type PropertyFeature = {
  /** DB column name — must match exactly */
  field: string;
  /** Human-readable label for display */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** How the value is stored and rendered */
  valueType: FeatureValueType;
  /** Unit suffix for number fields (e.g. "sqm", "m²") */
  unit?: string;
  /** Show on compact property card */
  showOnCard: boolean;
  /** Show on full detail page */
  showOnDetail: boolean;
  /** Display group — used to organise detail page sections */
  group: FeatureGroup;
};

export type FeatureGroup =
  | "core"
  | "layout"
  | "building"
  | "windows"
  | "amenities"
  | "premium";

// ── Feature map ───────────────────────────────────────────────────────────────

export const PROPERTY_FEATURES: PropertyFeature[] = [

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    field: "size_sqm",
    label: "Size",
    icon: Ruler,
    valueType: "number",
    unit: "m²",
    showOnCard: true,
    showOnDetail: true,
    group: "core",
  },
  {
    field: "bedrooms",
    label: "Bedrooms",
    icon: BedDouble,
    valueType: "number",
    showOnCard: true,
    showOnDetail: true,
    group: "core",
  },
  {
    field: "bathrooms",
    label: "Bathrooms",
    icon: Bath,
    valueType: "number",
    showOnCard: true,
    showOnDetail: true,
    group: "core",
  },
  {
    field: "floor",
    label: "Floor",
    icon: Layers,
    valueType: "number",
    showOnCard: true,
    showOnDetail: true,
    group: "core",
  },
  {
    field: "year_built",
    label: "Year Built",
    icon: CalendarDays,
    valueType: "number",
    showOnCard: true,
    showOnDetail: true,
    group: "building",
  },
  {
    field: "energy_class",
    label: "Energy Class",
    icon: Zap,
    valueType: "string",
    showOnCard: false,
    showOnDetail: true,
    group: "building",
  },

  // ── Layout & Rooms ────────────────────────────────────────────────────────
  {
    field: "living_rooms",
    label: "Living Rooms",
    icon: Sofa,
    valueType: "number",
    showOnCard: false,
    showOnDetail: true,
    group: "layout",
  },
  {
    field: "kitchens",
    label: "Kitchens",
    icon: UtensilsCrossed,
    valueType: "number",
    showOnCard: false,
    showOnDetail: true,
    group: "layout",
  },
  {
    field: "storage_rooms",
    label: "Storage Rooms",
    icon: Package,
    valueType: "number",
    showOnCard: false,
    showOnDetail: true,
    group: "layout",
  },
  {
    field: "wc",
    label: "WC",
    icon: DropletOff,
    valueType: "number",
    showOnCard: false,
    showOnDetail: true,
    group: "layout",
  },

  // ── Building ──────────────────────────────────────────────────────────────
  {
    field: "building_condition",
    label: "Condition",
    icon: Wrench,
    valueType: "string",
    showOnCard: false,
    showOnDetail: true,
    group: "building",
  },

  // ── Windows & Construction ────────────────────────────────────────────────
  {
    field: "frames_type",
    label: "Frames",
    icon: AppWindow,
    valueType: "string",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "flooring_type",
    label: "Flooring",
    icon: Layers2,
    valueType: "string",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "double_glazing",
    label: "Double Glazing",
    icon: Sparkles,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "triple_glazing",
    label: "Triple Glazing",
    icon: Sparkles,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "mosquito_screens",
    label: "Mosquito Screens",
    icon: AppWindow,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "thermal_insulation",
    label: "Thermal Insulation",
    icon: Thermometer,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },
  {
    field: "sound_insulation",
    label: "Sound Insulation",
    icon: Volume2,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "windows",
  },

  // ── Comfort & Amenities ───────────────────────────────────────────────────
  {
    field: "fireplace",
    label: "Fireplace",
    icon: Flame,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "elevator",
    label: "Elevator",
    icon: ArrowUp,
    valueType: "boolean",
    showOnCard: true,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "security_door",
    label: "Security Door",
    icon: ShieldCheck,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "alarm_system",
    label: "Alarm System",
    icon: Bell,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "video_doorphone",
    label: "Video Doorphone",
    icon: Video,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "smart_home",
    label: "Smart Home",
    icon: Cpu,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "satellite_tv",
    label: "Satellite TV",
    icon: Tv2,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "internet_ready",
    label: "Internet Ready",
    icon: Wifi,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "storage",
    label: "Storage",
    icon: Archive,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "pool",
    label: "Pool",
    icon: Droplets,
    valueType: "boolean",
    showOnCard: true,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "garden",
    label: "Garden",
    icon: Trees,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "sea_view",
    label: "Sea View",
    icon: Waves,
    valueType: "boolean",
    showOnCard: true,
    showOnDetail: true,
    group: "amenities",
  },
  {
    field: "mountain_view",
    label: "Mountain View",
    icon: Mountain,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: true,
    group: "amenities",
  },

  // ── Premium flags ─────────────────────────────────────────────────────────
  {
    field: "is_golden_visa",
    label: "Golden Visa",
    icon: BadgeCheck,
    valueType: "boolean",
    showOnCard: true,
    showOnDetail: true,
    group: "premium",
  },
  {
    field: "featured",
    label: "Featured",
    icon: Star,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: false,
    group: "premium",
  },
  {
    field: "private_collection",
    label: "Private Collection",
    icon: Lock,
    valueType: "boolean",
    showOnCard: false,
    showOnDetail: false,
    group: "premium",
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Quick lookup by field name */
export const FEATURE_BY_FIELD: Readonly<Record<string, PropertyFeature>> =
  Object.fromEntries(PROPERTY_FEATURES.map((f) => [f.field, f]));

/** Features eligible for the compact property card */
export const CARD_FEATURES = PROPERTY_FEATURES.filter((f) => f.showOnCard);

/** Features eligible for the full detail page */
export const DETAIL_FEATURES = PROPERTY_FEATURES.filter((f) => f.showOnDetail);

// ── Render gate ───────────────────────────────────────────────────────────────

/**
 * Returns true if a feature value should be rendered.
 *
 * Rules:
 *   boolean → true only if value is exactly `true`
 *   number  → true only if value is a finite number and not null/undefined
 *   string  → true only if value is a non-empty, non-whitespace string
 */
export function shouldRenderFeature(
  feature: PropertyFeature,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
): boolean {
  if (value === null || value === undefined) return false;

  switch (feature.valueType) {
    case "boolean":
      return value === true;
    case "number":
      return typeof value === "number" && isFinite(value);
    case "string":
      return typeof value === "string" && value.trim().length > 0;
  }
}

/**
 * Formats a feature value for display.
 *
 * Returns the formatted string, or null if the value should not render.
 * For boolean features returns the label only (no extra text).
 */
export function formatFeatureValue(
  feature: PropertyFeature,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
): string | null {
  if (!shouldRenderFeature(feature, value)) return null;

  switch (feature.valueType) {
    case "boolean":
      return feature.label;
    case "number":
      return feature.unit
        ? `${value.toLocaleString("en-EU")} ${feature.unit}`
        : String(value);
    case "string":
      return String(value);
  }
}
