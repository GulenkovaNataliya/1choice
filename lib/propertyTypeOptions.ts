/**
 * Property Type Options — single source of truth for category, subtype, and exposure.
 *
 * Used in: components/admin/PropertyForm.tsx
 *
 * Rules:
 *   - category values must match DB column `category` (existing: residential | commercial | land | hotel)
 *   - subtype values must match DB column `subtype` (existing free-text, now controlled)
 *   - exposure values map to DB column `exposure text[]`
 *   - Do NOT use this file for feature/amenity rendering — see lib/propertyFeatures.ts
 */

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Building,
  Building2,
  Layers,
  BedDouble,
  Briefcase,
  MapPin,
  Trees,
  Car,
  Warehouse,
  Wrench,
  Tag,
  Landmark,
  ArrowUp,
  LayoutGrid,
  Leaf,
  ArrowUpDown,
  Maximize2,
  CornerDownRight,
  Square,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CategoryValue = "residential" | "commercial" | "land" | "hotel";

export type CategoryOption = {
  value: CategoryValue;
  label: string;
  icon: LucideIcon;
};

export type SubtypeOption = {
  value: string;
  label: string;
  icon: LucideIcon;
  category: CategoryValue;
};

export type ExposureOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

// ── Categories ────────────────────────────────────────────────────────────────
// Values match existing DB column `category` — do not change without a migration.

export const CATEGORIES: CategoryOption[] = [
  { value: "residential", label: "Residential",        icon: Home      },
  { value: "commercial",  label: "Commercial",          icon: Briefcase },
  { value: "land",        label: "Land",                icon: Trees     },
  { value: "hotel",       label: "Hotel / Hospitality", icon: BedDouble },
];

// ── Subtypes ──────────────────────────────────────────────────────────────────
// Values match DB column `subtype` (free-text before; now controlled).
// Each subtype belongs to exactly one category.

export const SUBTYPES: SubtypeOption[] = [
  // Residential
  { value: "apartment",            label: "Apartment",            icon: Building,   category: "residential" },
  { value: "house",                label: "House",                icon: Home,        category: "residential" },
  { value: "maisonette",           label: "Maisonette",           icon: Layers,      category: "residential" },
  { value: "villa",                label: "Villa",                icon: Landmark,    category: "residential" },
  { value: "bungalow",             label: "Bungalow",             icon: Home,        category: "residential" },
  { value: "residential_building", label: "Residential Building", icon: Building2,   category: "residential" },
  { value: "residential_complex",  label: "Residential Complex",  icon: LayoutGrid,  category: "residential" },
  { value: "airspace",             label: "Airspace",             icon: ArrowUp,     category: "residential" },
  { value: "island",               label: "Island",               icon: MapPin,      category: "residential" },
  // Commercial
  { value: "office",               label: "Office",               icon: Briefcase,   category: "commercial"  },
  { value: "shop",                 label: "Shop",                 icon: Tag,         category: "commercial"  },
  { value: "commercial_building",  label: "Commercial Building",  icon: Building2,   category: "commercial"  },
  { value: "hall",                 label: "Hall",                 icon: LayoutGrid,  category: "commercial"  },
  { value: "warehouse",            label: "Warehouse",            icon: Warehouse,   category: "commercial"  },
  { value: "industrial",           label: "Industrial",           icon: Wrench,      category: "commercial"  },
  { value: "craft_unit",           label: "Craft Unit",           icon: Wrench,      category: "commercial"  },
  { value: "parking",              label: "Parking",              icon: Car,         category: "commercial"  },
  // Land
  { value: "plot",                 label: "Plot",                 icon: MapPin,      category: "land"        },
  { value: "agricultural_land",    label: "Agricultural Land",    icon: Leaf,        category: "land"        },
  { value: "farm_ranch",           label: "Farm / Ranch",         icon: Trees,       category: "land"        },
  // Hotel / Hospitality
  { value: "hotel",                label: "Hotel",                icon: BedDouble,   category: "hotel"       },
  { value: "hospitality_unit",     label: "Hospitality Unit",     icon: BedDouble,   category: "hotel"       },
];

// ── Exposure ──────────────────────────────────────────────────────────────────
// Maps to DB column `exposure text[]` — multi-select.

export const EXPOSURE_OPTIONS: ExposureOption[] = [
  { value: "corner",      label: "Corner",      icon: CornerDownRight },
  { value: "interior",    label: "Interior",    icon: Square          },
  { value: "dual_aspect", label: "Dual Aspect", icon: Maximize2       },
  { value: "frontage",    label: "Frontage",    icon: ArrowUp         },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getSubtypesByCategory(category: string): SubtypeOption[] {
  return SUBTYPES.filter((s) => s.category === category);
}

export function getCategoryForSubtype(subtype: string): string | null {
  return SUBTYPES.find((s) => s.value === subtype)?.category ?? null;
}
