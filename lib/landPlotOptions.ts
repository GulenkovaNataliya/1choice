/**
 * Land / Plot Options — single source of truth for land-specific UI chips.
 *
 * Used in: components/admin/PropertyForm.tsx
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
