/**
 * Land / Plot Options — single source of truth for land-specific UI chips and labels.
 *
 * Used in:
 *   - components/admin/PropertyForm.tsx  (admin UI chips)
 *   - app/properties/[slug]/PropertyDetailClient.tsx  (public display)
 *   - lib/chat/propertySearch.ts  (AI search criteria)
 *
 * Rules:
 *   - Values map to DB columns: land_slope text, land_features text[], town_planning_status text
 *   - Do NOT mix with propertyTypeOptions.ts (category/subtype/exposure)
 */

import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Map,
  Home,
  Minus,
  TrendingUp,
  Mountain,
  Shield,
  Droplets,
  Building,
  Hammer,
  Layers,
  FileText,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LandOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

// ── Town Planning Status (single-select) ──────────────────────────────────────

export const TOWN_PLANNING_OPTIONS: LandOption[] = [
  { value: "within_city_plan",   label: "Within City Plan",   icon: MapPin   },
  { value: "outside_city_plan",  label: "Outside City Plan",  icon: Map      },
  { value: "within_settlement",  label: "Within Settlement",  icon: Home     },
];

// ── Land Slope (single-select chips) ─────────────────────────────────────────

export const LAND_SLOPE_OPTIONS: LandOption[] = [
  { value: "flat",            label: "Flat",            icon: Minus      },
  { value: "sloped",          label: "Sloped",          icon: TrendingUp },
  { value: "amphitheatrical", label: "Amphitheatrical", icon: Mountain   },
];

// ── Land Features (multi-select chips) ───────────────────────────────────────

export const LAND_FEATURE_OPTIONS: LandOption[] = [
  { value: "fenced",             label: "Fenced",              icon: Shield   },
  { value: "borehole",           label: "Borehole",            icon: Droplets },
  { value: "existing_building",  label: "Existing Building",   icon: Building },
  { value: "buildable",          label: "Buildable",           icon: Hammer   },
  { value: "even_and_buildable", label: "Even & Buildable",    icon: Layers   },
  { value: "building_permit",    label: "Building Permit",     icon: FileText },
];

// ── Label-only lookup maps (for public display, no icon required) ─────────────

export const TOWN_PLANNING_LABEL: Record<string, string> = {
  within_city_plan:  "Within City Plan",
  outside_city_plan: "Outside City Plan",
  within_settlement: "Within Settlement",
};

export const LAND_SLOPE_LABEL: Record<string, string> = {
  flat:            "Flat",
  sloped:          "Sloped",
  amphitheatrical: "Amphitheatrical",
};

export const LAND_FEATURE_LABEL: Record<string, string> = {
  fenced:             "Fenced",
  borehole:           "Borehole",
  existing_building:  "Existing Building",
  buildable:          "Buildable",
  even_and_buildable: "Even & Buildable",
  building_permit:    "Building Permit",
};
