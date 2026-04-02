"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/logActivity";
import PropertyImageUpload from "@/components/admin/PropertyImageUpload";
import type { Area } from "@/lib/areas";
import { createAreaQuick } from "@/app/admin/areas/actions";
import type { Badge } from "@/lib/badges";
import { BADGE_COLORS, getBadgeStyle } from "@/lib/badgeColors";
import { createBadgeQuick } from "@/app/admin/badges/actions";
import { CATEGORIES, EXPOSURE_OPTIONS, getSubtypesByCategory } from "@/lib/propertyTypeOptions";
import { TOWN_PLANNING_OPTIONS, LAND_SLOPE_OPTIONS, LAND_FEATURE_OPTIONS } from "@/lib/landPlotOptions";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LevelDetail = {
  level_size_sqm: string;
  is_maisonette: boolean;
  bedrooms: string;
  bathrooms: string;
  wc: string;
  kitchens: string;
  living_rooms: string;
  versatile_rooms: string;
  hall: string;
  storage_rooms: string;
  wardrobe_room: boolean;
  balcony: boolean;
  veranda: boolean;
  awnings: boolean;
  private_roof_terrace: boolean;
  loft: boolean;
  internal_staircase: boolean;
  internal_elevator: boolean;
  fireplace: boolean;
  jacuzzi: boolean;
  home_cinema: boolean;
};

const EMPTY_LEVEL: LevelDetail = {
  level_size_sqm: "",
  is_maisonette: false,
  bedrooms: "",
  bathrooms: "",
  wc: "",
  kitchens: "",
  living_rooms: "",
  versatile_rooms: "",
  hall: "",
  storage_rooms: "",
  wardrobe_room: false,
  balcony: false,
  veranda: false,
  awnings: false,
  private_roof_terrace: false,
  loft: false,
  internal_staircase: false,
  internal_elevator: false,
  fireplace: false,
  jacuzzi: false,
  home_cinema: false,
};

type FormState = {
  title: string;
  slug: string;
  category: string;
  subtype: string;
  transaction_type: string;
  price_eur: string;
  location_slug: string;
  location_text: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  total_property_area_sqm: string;
  total_building_floors: string;
  number_of_levels: string;
  levels: LevelDetail[];
  year_built: string;
  year_renovated: string;
  building_condition: string;
  energy_class: string;
  heating_type: string;       // legacy — kept for backward compat
  custom_heating: string;
  cooling_type: string;       // legacy — kept for backward compat
  custom_cooling: string;
  heating_system: string;
  heating_fuel: string;
  heating_features: string[];
  cooling_system: string;
  fireplace: boolean;
  elevator: boolean;
  security_door: boolean;
  alarm_system: boolean;
  video_doorphone: boolean;
  smart_home: boolean;
  satellite_tv: boolean;
  internet_ready: boolean;
  wardrobe_room: boolean;
  sea_view: boolean;
  mountain_view: boolean;
  balcony: boolean;
  veranda: boolean;
  awnings: boolean;
  garden: boolean;
  pool: boolean;
  parking: boolean;
  parking_spaces: string;
  parking_type: string;
  parking_level: string;
  parking_area_sqm: string;
  parking_suitable_for: string[];
  parking_features: string[];
  exposure: string[];
  jacuzzi: boolean;
  close_to_beaches: boolean;
  panoramic_view: boolean;
  acropolis_view: boolean;
  private_roof_terrace: boolean;
  loft: boolean;
  internal_staircase: boolean;
  barbeque: boolean;
  home_cinema: boolean;
  smoke_detection: boolean;
  frames_type: string;
  single_glazing: boolean;
  double_glazing: boolean;
  triple_glazing: boolean;
  mosquito_screens: boolean;
  thermal_insulation: boolean;
  sound_insulation: boolean;
  blinds: boolean;
  electric_shutters: boolean;
  flooring_type: string;
  living_rooms: string;
  kitchens: string;
  storage_rooms: string;
  wc: string;
  furnished: string;
  custom_furnished: string;
  summary: string;
  description: string;
  agent_notes: string;
  is_golden_visa: boolean;
  featured: boolean;
  private_collection: boolean;
  publish_1choice: boolean;
  publish_deals: boolean;
  status: "draft" | "published" | "archived";
  cover_image_url: string;
  gallery_image_urls: string[];
  youtube_video_url: string;
  virtual_tour_url: string;
  latitude: string;
  longitude: string;
  approximate_location: boolean;
  address: string;
  show_address: boolean;
  custom_badge: string;
  custom_badge_color: string;
  // Electricity
  electricity: string[];
  // Land / Plot
  land_area_sqm: string;
  building_coefficient: string;
  coverage_ratio: string;
  frontage_m: string;
  remaining_buildable_area_sqm: string;
  town_planning_status: string;
  land_slope: string;
  land_features: string[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const INITIAL: FormState = {
  title: "",
  slug: "",
  category: "",
  subtype: "",
  transaction_type: "sale",
  price_eur: "",
  location_slug: "",
  location_text: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  total_property_area_sqm: "",
  total_building_floors: "",
  number_of_levels: "1",
  levels: [{ ...EMPTY_LEVEL }],
  year_built: "",
  year_renovated: "",
  building_condition: "",
  energy_class: "",
  heating_type: "",
  custom_heating: "",
  cooling_type: "",
  custom_cooling: "",
  heating_system: "",
  heating_fuel: "",
  heating_features: [],
  cooling_system: "",
  fireplace: false,
  elevator: false,
  security_door: false,
  alarm_system: false,
  video_doorphone: false,
  smart_home: false,
  satellite_tv: false,
  internet_ready: false,
  wardrobe_room: false,
  sea_view: false,
  mountain_view: false,
  balcony: false,
  veranda: false,
  awnings: false,
  garden: false,
  pool: false,
  parking: false,
  parking_spaces: "",
  parking_type: "",
  parking_level: "",
  parking_area_sqm: "",
  parking_suitable_for: [],
  parking_features: [],
  exposure: [],
  jacuzzi: false,
  close_to_beaches: false,
  panoramic_view: false,
  acropolis_view: false,
  private_roof_terrace: false,
  loft: false,
  internal_staircase: false,
  barbeque: false,
  home_cinema: false,
  smoke_detection: false,
  frames_type: "",
  single_glazing: false,
  double_glazing: false,
  triple_glazing: false,
  mosquito_screens: false,
  thermal_insulation: false,
  sound_insulation: false,
  blinds: false,
  electric_shutters: false,
  flooring_type: "",
  living_rooms: "",
  kitchens: "",
  storage_rooms: "",
  wc: "",
  furnished: "",
  custom_furnished: "",
  summary: "",
  description: "",
  agent_notes: "",
  is_golden_visa: false,
  featured: false,
  private_collection: false,
  publish_1choice: true,
  publish_deals: false,
  status: "draft",
  cover_image_url: "",
  gallery_image_urls: [],
  youtube_video_url: "",
  virtual_tour_url: "",
  latitude: "",
  longitude: "",
  approximate_location: false,
  address: "",
  show_address: false,
  custom_badge: "",
  custom_badge_color: "red",
  // Electricity
  electricity: [],
  // Land / Plot
  land_area_sqm: "",
  building_coefficient: "",
  coverage_ratio: "",
  frontage_m: "",
  remaining_buildable_area_sqm: "",
  town_planning_status: "",
  land_slope: "",
  land_features: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Returns a slug that does not already exist in the properties table.
 * Fetches all slugs starting with `base` in one query, then finds the
 * first free candidate: base → base-2 → base-3 … → base-99 → base-<ts>.
 */
async function findUniqueSlug(base: string): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("properties")
    .select("slug")
    .like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r: { slug: string | null }) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Returns true if any level has the given boolean field set to true. */
function someLevelTrue(
  levels: LevelDetail[],
  key: keyof Pick<LevelDetail, "wardrobe_room" | "balcony" | "veranda" | "awnings" | "private_roof_terrace" | "loft" | "internal_staircase" | "fireplace" | "jacuzzi" | "home_cinema">
): boolean {
  return levels.some((l) => l[key] === true);
}

/** Sum a numeric field across all levels.
 *  Returns null only when no level has any meaningful input (all empty / blank).
 *  Returns 0 when at least one level has an explicit "0" entry.
 */
function sumLevels(
  levels: LevelDetail[],
  key: keyof Pick<LevelDetail, "bedrooms" | "bathrooms" | "wc" | "kitchens" | "living_rooms" | "storage_rooms" | "versatile_rooms">
): number | null {
  let total = 0;
  let hasValue = false;
  for (const l of levels) {
    const raw = l[key] as string;
    if (raw !== "" && raw != null) {
      const v = Number(raw);
      if (!isNaN(v)) {
        total += v;
        hasValue = true;
      }
    }
  }
  return hasValue ? total : null;
}

function buildPayload(form: FormState, resolveSlug = false) {
  return {
    title: form.title,
    // resolveSlug=true: compute slug but fall back to null (not "") so the UNIQUE
    // constraint is never violated by an empty string when title is also blank.
    // PostgreSQL UNIQUE excludes NULLs, so null is always safe here.
    slug: resolveSlug ? (form.slug.trim() || toSlug(form.title) || null) : (form.slug || null),
    category: form.category || null,
    subtype: form.subtype || null,
    transaction_type: form.transaction_type || null,
    price_eur: form.price_eur ? Number(form.price_eur) : null,
    price:     form.price_eur ? Number(form.price_eur) : null, // legacy column kept in sync
    location: form.location_slug || null,
    location_text: form.location_text || null,
    // size_sqm / size derived from total_property_area_sqm — keeps AI, filters, cards, catalog working
    size_sqm: form.total_property_area_sqm ? Number(form.total_property_area_sqm) : null,
    size:     form.total_property_area_sqm ? Number(form.total_property_area_sqm) : null,
    // Legacy flat columns — summed across all levels so existing queries/AI/catalog still work
    bedrooms: form.levels.length > 0 ? sumLevels(form.levels, "bedrooms") : (form.bedrooms ? Number(form.bedrooms) : null),
    bathrooms: form.levels.length > 0 ? sumLevels(form.levels, "bathrooms") : (form.bathrooms ? Number(form.bathrooms) : null),
    floor: form.floor || null,
    total_property_area_sqm: form.total_property_area_sqm ? Number(form.total_property_area_sqm) : null,
    total_building_floors: form.total_building_floors ? Number(form.total_building_floors) : null,
    number_of_levels: form.number_of_levels ? Number(form.number_of_levels) : null,
    level_details: form.levels.length > 0 ? form.levels : null,
    year_built: form.year_built ? Number(form.year_built) : null,
    year_renovated: form.year_renovated ? Number(form.year_renovated) : null,
    building_condition: form.building_condition || null,
    energy_class: form.energy_class || null,
    // New structured fields
    heating_system: form.heating_system || null,
    heating_fuel: form.heating_fuel || null,
    heating_features: form.heating_features.length > 0 ? form.heating_features : null,
    cooling_system: form.cooling_system || null,
    custom_heating: form.custom_heating.trim() || null,
    custom_cooling: form.custom_cooling.trim() || null,
    // Legacy fields — derived from new structured fields so AI/search/filter keeps working
    heating_type: (() => {
      if (form.heating_system) {
        if (form.heating_system === "central" || form.heating_system === "none") return form.heating_system;
        if (form.heating_system === "central_autonomous" || form.heating_system === "autonomous") return "autonomous";
      }
      if (!form.heating_system && form.heating_features.includes("heat_pump")) return "heat_pump";
      if (!form.heating_system && form.heating_fuel) {
        if (form.heating_fuel === "natural_gas" || form.heating_fuel === "oil" || form.heating_fuel === "electric") return form.heating_fuel;
      }
      return form.heating_type || null;
    })(),
    cooling_type: (() => {
      if (form.cooling_system) {
        if (form.cooling_system === "central_ac") return "central_ac";
        if (form.cooling_system === "split_units") return "split_units";
        if (form.cooling_system === "fan_coil")    return "fan";
        if (form.cooling_system === "none")        return "none";
      }
      return form.cooling_type || null;
    })(),
    // Level-derived booleans: OR across all levels when levels exist; fallback to global form field for legacy properties.
    fireplace:            form.levels.length > 0 ? someLevelTrue(form.levels, "fireplace")            : form.fireplace,
    wardrobe_room:        form.levels.length > 0 ? someLevelTrue(form.levels, "wardrobe_room")        : form.wardrobe_room,
    balcony:              form.levels.length > 0 ? someLevelTrue(form.levels, "balcony")              : form.balcony,
    veranda:              form.levels.length > 0 ? someLevelTrue(form.levels, "veranda")              : form.veranda,
    awnings:              form.levels.length > 0 ? someLevelTrue(form.levels, "awnings")              : form.awnings,
    jacuzzi:              form.levels.length > 0 ? someLevelTrue(form.levels, "jacuzzi")              : form.jacuzzi,
    private_roof_terrace: form.levels.length > 0 ? someLevelTrue(form.levels, "private_roof_terrace") : form.private_roof_terrace,
    loft:                 form.levels.length > 0 ? someLevelTrue(form.levels, "loft")                 : form.loft,
    internal_staircase:   form.levels.length > 0 ? someLevelTrue(form.levels, "internal_staircase")   : form.internal_staircase,
    home_cinema:          form.levels.length > 0 ? someLevelTrue(form.levels, "home_cinema")          : form.home_cinema,
    // Global-only fields (no level equivalent):
    elevator: form.elevator,
    security_door: form.security_door,
    alarm_system: form.alarm_system,
    video_doorphone: form.video_doorphone,
    smart_home: form.smart_home,
    satellite_tv: form.satellite_tv,
    internet_ready: form.internet_ready,
    sea_view: form.sea_view,
    mountain_view: form.mountain_view,
    garden: form.garden,
    pool: form.pool,
    // Parking structured fields — gated by checkbox; cleared when unchecked
    parking_spaces:       form.parking ? (form.parking_spaces.trim() || null) : null,
    parking_type:         form.parking ? (form.parking_type || null) : null,
    parking_level:        form.parking ? (form.parking_level || null) : null,
    parking_area_sqm:     form.parking && form.parking_area_sqm ? Number(form.parking_area_sqm) : null,
    parking_suitable_for: form.parking && form.parking_suitable_for.length > 0 ? form.parking_suitable_for : null,
    parking_features:     form.parking && form.parking_features.length > 0 ? form.parking_features : null,
    // Legacy boolean — checkbox is source of truth; keeps AI / filters working unchanged
    parking: form.parking,
    exposure: form.exposure.length > 0 ? form.exposure : null,
    close_to_beaches: form.close_to_beaches,
    panoramic_view: form.panoramic_view,
    acropolis_view: form.acropolis_view,
    barbeque: form.barbeque,
    smoke_detection: form.smoke_detection,
    frames_type: form.frames_type || null,
    single_glazing: form.single_glazing,
    double_glazing: form.double_glazing,
    triple_glazing: form.triple_glazing,
    mosquito_screens: form.mosquito_screens,
    thermal_insulation: form.thermal_insulation,
    sound_insulation: form.sound_insulation,
    blinds: form.blinds,
    electric_shutters: form.electric_shutters,
    flooring_type: form.flooring_type || null,
    living_rooms: form.levels.length > 0 ? sumLevels(form.levels, "living_rooms") : (form.living_rooms ? Number(form.living_rooms) : null),
    kitchens: form.levels.length > 0 ? sumLevels(form.levels, "kitchens") : (form.kitchens ? Number(form.kitchens) : null),
    storage_rooms: form.levels.length > 0 ? sumLevels(form.levels, "storage_rooms") : (form.storage_rooms ? Number(form.storage_rooms) : null),
    wc: form.levels.length > 0 ? sumLevels(form.levels, "wc") : (form.wc ? Number(form.wc) : null),
    versatile_rooms: form.levels.length > 0 ? sumLevels(form.levels, "versatile_rooms") : null,
    furnished: form.furnished.trim() || null,
    custom_furnished: form.custom_furnished.trim() || null,
    summary: form.summary || null,
    description: form.description || null,
    agent_notes: form.agent_notes || null,
    is_golden_visa: form.is_golden_visa,
    featured: form.featured,
    private_collection: form.private_collection,
    publish_1choice: form.publish_1choice,
    publish_deals: form.publish_deals,
    status: form.status,
    cover_image_url: form.cover_image_url || null,
    gallery_image_urls: form.gallery_image_urls,
    youtube_video_url: form.youtube_video_url || null,
    virtual_tour_url: form.virtual_tour_url || null,
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    approximate_location: form.approximate_location,
    address: form.address.trim() || null,
    show_address: form.show_address,
    custom_badge: form.custom_badge || null,
    custom_badge_color: form.custom_badge ? (form.custom_badge_color || "red") : null,
    // Electricity
    electricity: form.electricity.length > 0 ? form.electricity : null,
    // Land / Plot
    land_area_sqm:                form.land_area_sqm ? Number(form.land_area_sqm) : null,
    building_coefficient:         form.building_coefficient ? Number(form.building_coefficient) : null,
    coverage_ratio:               form.coverage_ratio ? Number(form.coverage_ratio) : null,
    frontage_m:                   form.frontage_m ? Number(form.frontage_m) : null,
    remaining_buildable_area_sqm: form.remaining_buildable_area_sqm ? Number(form.remaining_buildable_area_sqm) : null,
    town_planning_status:         form.town_planning_status || null,
    land_slope:                   form.land_slope || null,
    land_features:                form.land_features.length > 0 ? form.land_features : null,
  };
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 flex flex-col gap-4">
      <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest border-b border-[#F0F0F0] pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1E1E1E]">
        {label}
        {hint && <span className="ml-2 text-xs text-[#AAAAAA] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition";

const textareaCls =
  "w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition resize-y min-h-[100px]";

function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-[#D9D9D9] accent-[#1E1E1E] shrink-0"
        />
        <span className="text-sm text-[#1E1E1E]">{label}</span>
      </label>
      {hint && <p className="text-xs text-[#AAAAAA] pl-7 leading-snug">{hint}</p>}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const label =
    status === "saving" ? "Saving…"
    : status === "saved"  ? "Saved"
    : "Error saving";
  const color =
    status === "saving" ? "text-gray-400"
    : status === "saved"  ? "text-green-600"
    : "text-red-500";
  return <span className={`text-sm ${color} transition-colors`}>{label}</span>;
}

// ── Quick-create area modal ────────────────────────────────────────────────────

function QuickAreaModal({
  existingGroups,
  onSuccess,
  onClose,
}: {
  existingGroups: string[];
  onSuccess: (area: Area) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slug = toSlug(name);

  async function handleCreate() {
    if (!name.trim() || !group.trim()) return;
    setSaving(true);
    setErr(null);
    const result = await createAreaQuick(name.trim(), slug, group.trim());
    if ("error" in result) {
      console.error("[QuickAreaModal]", result.error);
      setErr(
        result.error.toLowerCase().includes("duplicate") || result.error.toLowerCase().includes("unique")
          ? "An area with this name or slug already exists."
          : "Failed to create area. Please try again."
      );
      setSaving(false);
      return;
    }
    onSuccess(result);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#1E1E1E]">Add new area</h3>

        <Field label="Area Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="e.g. Glyfada"
            autoFocus
          />
        </Field>

        <Field label="Group / Region" hint="groups related areas together">
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className={inputCls}
            placeholder="e.g. Athens Riviera"
            list="quick-area-groups"
          />
          <datalist id="quick-area-groups">
            {existingGroups.map((g) => <option key={g} value={g} />)}
          </datalist>
        </Field>

        {name.trim() && (
          <p className="text-xs text-[#AAAAAA] -mt-2">
            Slug: <span className="font-mono">{slug || "—"}</span>
          </p>
        )}

        {err && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{err}</p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#D9D9D9] text-xs font-medium text-[#1E1E1E] rounded-lg hover:bg-[#F5F5F5] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || !group.trim() || saving}
            className="px-4 py-1.5 bg-[#1E1E1E] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-40 disabled:cursor-default"
          >
            {saving ? "Creating…" : "Create area"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick-create badge modal ───────────────────────────────────────────────────

function QuickBadgeModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (badge: Badge, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("red");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const trimmed = name.trim();
  const tooLong = trimmed.length > 22;

  async function handleCreate() {
    if (!trimmed || tooLong) return;
    setSaving(true);
    setErr(null);
    const result = await createBadgeQuick(trimmed);
    if ("error" in result) {
      setErr(result.error);
      setSaving(false);
      return;
    }
    onSuccess(result, color);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#1E1E1E]">Add new badge</h3>

        <Field label="Badge Name" hint="max 22 characters">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="e.g. New Listing"
            autoFocus
            maxLength={30}
          />
          {tooLong && (
            <p className="text-xs text-red-600 mt-0.5">{trimmed.length}/22 — too long</p>
          )}
        </Field>

        <Field label="Color">
          <div className="flex gap-2 flex-wrap">
            {BADGE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition ${
                  color === c.value ? "border-[#1E1E1E]" : "border-transparent hover:border-[#D9D9D9]"
                }`}
              >
                <span
                  className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded"
                  style={getBadgeStyle(c.value)}
                >
                  {trimmed || c.label}
                </span>
              </button>
            ))}
          </div>
        </Field>

        {trimmed && !tooLong && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#AAAAAA]">Preview:</span>
            <span
              className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded"
              style={getBadgeStyle(color)}
            >
              {trimmed}
            </span>
          </div>
        )}

        {err && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{err}</p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#D9D9D9] text-xs font-medium text-[#1E1E1E] rounded-lg hover:bg-[#F5F5F5] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!trimmed || tooLong || saving}
            className="px-4 py-1.5 bg-[#1E1E1E] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-40 disabled:cursor-default"
          >
            {saving ? "Creating…" : "Create badge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props =
  | { mode?: "create"; propertyCode: string; propertyId?: never; initialValues?: never; areas?: Area[]; badges?: Badge[] }
  | { mode: "edit"; propertyId: string; propertyCode: string; initialValues: Partial<FormState>; areas?: Area[]; badges?: Badge[] };

export default function PropertyForm({ mode = "create", propertyCode, propertyId, initialValues, areas = [], badges = [] }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [localAreas, setLocalAreas] = useState<Area[]>(areas);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [localBadges, setLocalBadges] = useState<Badge[]>(badges);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const lastSavedRef = useRef<string>(JSON.stringify({ ...INITIAL, ...initialValues }));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalSlugRef = useRef<string>(initialValues?.slug?.trim() ?? "");
  const formRef = useRef<FormState>({ ...INITIAL, ...initialValues });

  // ── Geocoding state ──────────────────────────────────────────────────────────
  type GeoStatus = "idle" | "loading" | "found" | "not_found" | "error";
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  // ── Advanced section toggle (slug) ────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(initialValues?.category ?? null);

  async function lookupCoordinates() {
    const q = form.address.trim();
    if (!q) return;
    setGeoStatus("loading");
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=gr`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data: { lat: string; lon: string }[] = await res.json();
      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          latitude:  parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6),
        }));
        setGeoStatus("found");
      } else {
        setGeoStatus("not_found");
      }
    } catch {
      setGeoStatus("error");
    }
  }

  // Keep formRef in sync for beforeunload
  useEffect(() => { formRef.current = form; }, [form]);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setLevel<K extends keyof LevelDetail>(idx: number, key: K, value: LevelDetail[K]) {
    setForm((prev) => {
      const updated = prev.levels.map((l, i) => i === idx ? { ...l, [key]: value } : l);
      return { ...prev, levels: updated };
    });
  }

  function setNumberOfLevels(v: string) {
    const n = Math.max(1, parseInt(v, 10) || 1);
    setForm((prev) => {
      const current = prev.levels;
      let updated: LevelDetail[];
      if (n > current.length) {
        updated = [...current, ...Array.from({ length: n - current.length }, () => ({ ...EMPTY_LEVEL }))];
      } else {
        updated = current.slice(0, n);
      }
      return { ...prev, number_of_levels: String(n), levels: updated };
    });
  }

  // ── Autosave ────────────────────────────────────────────────────────────────

  const autosave = useCallback(async (snapshot: FormState) => {
    if (mode !== "edit") return;

    const current = JSON.stringify(snapshot);
    if (current === lastSavedRef.current) return;

    setSaveStatus("saving");
    try {
      const { error: dbError } = await getSupabase()
        .from("properties")
        .update(buildPayload(snapshot))
        .eq("id", propertyId);

      if (dbError) {
        console.error("[PropertyForm] autosave error:", dbError);
        setSaveStatus("error");
      } else {
        lastSavedRef.current = current;
        setSaveStatus("saved");
        logActivity(propertyId!, "property_updated", { autosave: true, property_code: propertyCode });
      }
    } catch (err) {
      console.error("[PropertyForm] autosave unexpected error:", err);
      setSaveStatus("error");
    }
  }, [mode, propertyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "edit") return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      autosave(form);
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form]); // intentionally omit stable refs/callbacks — form changes are the trigger

  // Unsaved changes protection (C)
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (JSON.stringify(formRef.current) !== lastSavedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // ── Publish validation (draft saves skip this block entirely) ────────────
    if (form.status === "published") {
      const errs: string[] = [];
      if (!form.title.trim())              errs.push("Title is required.");
      if (!form.price_eur)                 errs.push("Price is required.");
      if (!form.category)                  errs.push("Category is required.");
      if (!form.gallery_image_urls.length) errs.push("At least 1 photo is required to publish.");
      if (!form.description.trim() && !form.summary.trim())
                                           errs.push("Description or summary is required to publish.");
      if (errs.length > 0) {
        setError("Cannot publish — please fix:\n• " + errs.join("\n• "));
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSaveStatus("saving");

    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const supabase = getSupabase();
      let dbError;

      if (mode === "edit") {
        const newSlug = form.slug.trim() || toSlug(form.title);
        const originalSlug = originalSlugRef.current;
        const slugChanged = originalSlug && newSlug !== originalSlug;

        if (slugChanged) {
          try {
            await supabase.from("property_slug_redirects").insert({
              old_slug: originalSlug,
              property_id: propertyId,
            });
          } catch {
            // Ignore — duplicate old_slug must not block the update
          }
        }

        const { error } = await supabase
          .from("properties")
          .update(buildPayload(form, true))
          .eq("id", propertyId);
        dbError = error;
        if (!error) {
          const originalStatus = initialValues?.status;
          if (originalStatus && form.status !== originalStatus) {
            logActivity(propertyId!, "property_status_changed", {
              from: originalStatus,
              to: form.status,
              property_code: propertyCode,
            });
          }
          const meta = slugChanged
            ? { slug_changed: true, from: originalSlug, to: newSlug, property_code: propertyCode }
            : { property_code: propertyCode };
          logActivity(propertyId!, "property_updated", meta);
          if (slugChanged) originalSlugRef.current = newSlug;
        }
      } else {
        // toSlug() strips all non-ASCII — Greek/Russian/Hebrew titles produce "".
        // Fall back to property code so drafts always get a unique, non-empty slug.
        const baseSlug = form.slug.trim() || toSlug(form.title) || `draft-${propertyCode.toLowerCase()}`;
        const uniqueSlug = await findUniqueSlug(baseSlug);
        const insertPayload = {
          property_code: propertyCode,
          ...buildPayload(form, false), // slug resolved below; skip internal resolution
          slug: uniqueSlug,
        };
        console.log("[PropertyForm] create — slug:", uniqueSlug, "| payload keys:", Object.keys(insertPayload).sort().join(", "));
        const { data: created, error } = await supabase
          .from("properties")
          .insert(insertPayload)
          .select("id")
          .single();
        dbError = error;
        if (!error && created?.id) logActivity(created.id, "property_created", { title: form.title, property_code: propertyCode });
      }

      if (dbError) {
        console.error("[PropertyForm] save error:", {
          mode,
          code: (dbError as { code?: string }).code,
          message: dbError.message,
          details: (dbError as { details?: string }).details,
          hint: (dbError as { hint?: string }).hint,
        });
        const dbMsg = dbError.message ?? "";
        setError(dbMsg ? `Failed to save property: ${dbMsg}` : "Failed to save property. Please try again.");
        setSaveStatus("error");
        setLoading(false);
        return;
      }

      lastSavedRef.current = JSON.stringify(form);
      setSaveStatus("saved");
      if (mode === "create") {
        router.push("/admin/properties");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("[PropertyForm] unexpected error:", err);
      setError("An unexpected error occurred. Please check your connection and try again.");
      setSaveStatus("error");
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isDraft = form.status === "draft";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-[#E8E8E8] rounded-lg px-4 py-2.5 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-[#AAAAAA]">
            Property Code: <span className="font-mono font-semibold text-[#1E1E1E]">{propertyCode}</span>
          </span>
          {mode === "edit" && (
            <span className="text-xs text-[#AAAAAA] hidden sm:inline">· Autosave enabled</span>
          )}
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {mode === "edit" && form.status === "published" && form.slug && (
            <a
              href={`/properties/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition whitespace-nowrap"
            >
              View on site ↗
            </a>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-[#1E1E1E] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default whitespace-nowrap"
          >
            {loading ? "Saving…" : mode === "edit" ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg whitespace-pre-line">
          {error}
        </div>
      )}

      {/* ── Publishing ────────────────────────────────────────────────────── */}
      <Section title="Publishing">
        <div className="flex flex-col gap-3 mb-2">
          <Checkbox
            label="Publish on 1Choice"
            checked={form.publish_1choice}
            onChange={(v) => set("publish_1choice", v)}
            hint="Listing appears in the public catalogue when status is Published"
          />
          <Checkbox
            label="Publish on 1ChoiceDeals"
            checked={form.publish_deals}
            onChange={(v) => set("publish_deals", v)}
            hint="Shown in the Deals section with special visibility and export access"
          />
        </div>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as FormState["status"])}
            className={inputCls}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </Section>

      {/* ── Main Block ─────────────────────────────────────────────────────── */}
      <Section title="Main Block">
        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="e.g. Luxury Villa in Santorini"
          />
        </Field>
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-[#AAAAAA] hover:text-[#1E1E1E] transition-colors flex items-center gap-1"
          >
            {showAdvanced ? "▾" : "▸"} Advanced
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <Field label="Slug" hint="auto-generated from title if left empty — changing this will break existing links">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. luxury-villa-santorini"
                />
              </Field>
            </div>
          )}
        </div>
        <Field label="Transaction Type">
          <select
            value={form.transaction_type}
            onChange={(e) => set("transaction_type", e.target.value)}
            className={inputCls}
          >
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
            <option value="antiparochi">Antiparochi</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (€)">
            <input
              type="number"
              value={form.price_eur}
              onChange={(e) => set("price_eur", e.target.value)}
              className={inputCls}
              placeholder="450000"
              min={0}
            />
          </Field>
          <Field label="Location">
            <div className="flex flex-col gap-1">
              {localAreas.length > 0 ? (
                <select
                  value={form.location_slug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    const area = localAreas.find((a) => a.slug === slug);
                    setForm((prev) => ({
                      ...prev,
                      location_slug: slug,
                      location_text: area?.name ?? "",
                    }));
                  }}
                  className={inputCls}
                >
                  <option value="">— select area —</option>
                  {Array.from(new Set(localAreas.map((a) => a.group_name))).map((group) => (
                    <optgroup key={group} label={group}>
                      {localAreas.filter((a) => a.group_name === group).map((a) => (
                        <option key={a.slug} value={a.slug}>{a.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.location_text}
                  onChange={(e) => set("location_text", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Athens"
                />
              )}
              <button
                type="button"
                onClick={() => setShowAreaModal(true)}
                className="text-sm font-medium text-[#C1121F] hover:opacity-70 transition-opacity self-start"
              >
                + Add new area
              </button>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Property Type ──────────────────────────────────────────────────── */}
      <Section title="Property Type">
        {/* 2-column accordion grid — one accordion open at a time */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isOpen = openAccordion === cat.value;
            const subtypes = getSubtypesByCategory(cat.value);
            return (
              <div
                key={cat.value}
                className={`rounded-lg border transition-colors ${
                  isOpen ? "border-[#1E1E1E]" : "border-[#E8E8E8]"
                }`}
              >
                {/* Accordion header — opens/closes card and sets category */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOpen) {
                      setOpenAccordion(null);
                    } else {
                      setOpenAccordion(cat.value);
                      if (form.category !== cat.value) {
                        setForm((prev) => ({ ...prev, category: cat.value, subtype: "" }));
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors ${
                    isOpen ? "text-[#1E1E1E]" : "text-[#555555] hover:text-[#1E1E1E]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CatIcon size={14} />
                    {cat.label}
                  </span>
                  <span className="text-xs text-[#AAAAAA]">{isOpen ? "▾" : "▸"}</span>
                </button>
                {/* Subtype chips — visible only when accordion is open */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-3 border-t border-[#F0F0F0] flex flex-wrap gap-2">
                    {subtypes.map((sub) => {
                      const SubIcon = sub.icon;
                      const isActive = form.subtype === sub.value;
                      return (
                        <button
                          key={sub.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              category: cat.value,
                              subtype: isActive ? "" : sub.value,
                            }));
                          }}
                          className={`flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-base font-medium border transition-colors ${
                            isActive
                              ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                              : "bg-white text-[#1E1E1E] border-[#D9D9D9] hover:border-[#1E1E1E] hover:bg-[#F5F5F5]"
                          }`}
                        >
                          <SubIcon size={13} />
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Property Position / Exposure — 4-column grid below the accordion */}
        <div>
          <p className="text-sm font-medium text-[#1E1E1E] mb-2">Property Position / Exposure</p>
          <div className="grid grid-cols-4 gap-2">
            {EXPOSURE_OPTIONS.map((exp) => {
              const ExpIcon = exp.icon;
              const isActive = form.exposure.includes(exp.value);
              return (
                <button
                  key={exp.value}
                  type="button"
                  onClick={() => {
                    const next = isActive
                      ? form.exposure.filter((v) => v !== exp.value)
                      : [...form.exposure, exp.value];
                    set("exposure", next);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 h-9 rounded-lg text-base font-medium border transition-colors ${
                    isActive
                      ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                      : "bg-white text-[#1E1E1E] border-[#D9D9D9] hover:border-[#1E1E1E] hover:bg-[#F5F5F5]"
                  }`}
                >
                  <ExpIcon size={13} />
                  {exp.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Building Information ──────────────────────────────────────────── */}
      <Section title="Building Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Total Property Area (sqm)" hint="All levels combined">
            <input
              type="number"
              value={form.total_property_area_sqm}
              onChange={(e) => set("total_property_area_sqm", e.target.value)}
              className={inputCls}
              placeholder="240"
              min={0}
            />
          </Field>
          <Field label="Property Floor" hint="Floor the property is on">
            <select
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              <optgroup label="Special">
                <option value="basement">Basement</option>
                <option value="semi_basement">Semi-Basement</option>
                <option value="ground_floor">Ground Floor</option>
                <option value="raised_ground_floor">Raised Ground Floor</option>
                <option value="mezzanine">Mezzanine</option>
              </optgroup>
              <optgroup label="Floor number">
                {Array.from({ length: 15 }, (_, i) => String(i + 1)).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Total Building Floors">
            <input
              type="number"
              value={form.total_building_floors}
              onChange={(e) => set("total_building_floors", e.target.value)}
              className={inputCls}
              placeholder="6"
              min={1}
            />
          </Field>
          <Field label="Number of Levels" hint="Drives Level Details blocks below">
            <input
              type="number"
              value={form.number_of_levels}
              onChange={(e) => setNumberOfLevels(e.target.value)}
              className={inputCls}
              placeholder="1"
              min={1}
              max={10}
            />
          </Field>
          <Field label="Year Built" hint="optional">
            <input
              type="number"
              value={form.year_built}
              onChange={(e) => set("year_built", e.target.value)}
              className={inputCls}
              placeholder="2005"
              min={1800}
            />
          </Field>
          <Field label="Year Renovated" hint="optional">
            <input
              type="number"
              value={form.year_renovated}
              onChange={(e) => set("year_renovated", e.target.value)}
              className={inputCls}
              placeholder="2018"
              min={1800}
            />
          </Field>
          <Field label="Building Condition">
            <select
              value={form.building_condition}
              onChange={(e) => set("building_condition", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="new">New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="needs_renovation">Needs Renovation</option>
            </select>
          </Field>
          <Field label="Energy Class">
            <select
              value={form.energy_class}
              onChange={(e) => set("energy_class", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Land / Plot ───────────────────────────────────────────────────── */}
      <Section title="Land / Plot">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Land Area (sqm)">
            <input
              type="number"
              value={form.land_area_sqm}
              onChange={(e) => set("land_area_sqm", e.target.value)}
              className={inputCls}
              placeholder="500"
              min={0}
            />
          </Field>
          <Field label="Building Coefficient" hint="e.g. 0.4">
            <input
              type="number"
              value={form.building_coefficient}
              onChange={(e) => set("building_coefficient", e.target.value)}
              className={inputCls}
              placeholder="0.4"
              min={0}
              step={0.01}
            />
          </Field>
          <Field label="Coverage Ratio" hint="e.g. 0.6">
            <input
              type="number"
              value={form.coverage_ratio}
              onChange={(e) => set("coverage_ratio", e.target.value)}
              className={inputCls}
              placeholder="0.6"
              min={0}
              step={0.01}
            />
          </Field>
          <Field label="Frontage (m)">
            <input
              type="number"
              value={form.frontage_m}
              onChange={(e) => set("frontage_m", e.target.value)}
              className={inputCls}
              placeholder="20"
              min={0}
              step={0.1}
            />
          </Field>
          <Field label="Remaining Buildable Area (sqm)">
            <input
              type="number"
              value={form.remaining_buildable_area_sqm}
              onChange={(e) => set("remaining_buildable_area_sqm", e.target.value)}
              className={inputCls}
              placeholder="200"
              min={0}
            />
          </Field>
          <Field label="Town Planning Status">
            <select
              value={form.town_planning_status}
              onChange={(e) => set("town_planning_status", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              {TOWN_PLANNING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Land Slope — single-select chips */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">Land Slope</p>
          <div className="flex flex-wrap gap-2">
            {LAND_SLOPE_OPTIONS.map((o) => {
              const active = form.land_slope === o.value;
              const Icon = o.icon;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("land_slope", active ? "" : o.value)}
                  className={`flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-base font-medium border transition-colors ${
                    active
                      ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                      : "bg-white text-[#1E1E1E] border-[#CCCCCC] hover:border-[#1E1E1E]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Land Features — multi-select chips */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">Land Features</p>
          <div className="flex flex-wrap gap-2">
            {LAND_FEATURE_OPTIONS.map((o) => {
              const active = form.land_features.includes(o.value);
              const Icon = o.icon;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? form.land_features.filter((v) => v !== o.value)
                      : [...form.land_features, o.value];
                    set("land_features", next);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-base font-medium border transition-colors ${
                    active
                      ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                      : "bg-white text-[#1E1E1E] border-[#CCCCCC] hover:border-[#1E1E1E]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Comfort & Amenities ───────────────────────────────────────────── */}
      <Section title="Comfort & Amenities">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {/* Column 1 — views */}
          <div className="flex flex-col gap-3">
            <Checkbox label="Sea View"           checked={form.sea_view}           onChange={(v) => set("sea_view", v)} />
            <Checkbox label="Close to Beaches"   checked={form.close_to_beaches}   onChange={(v) => set("close_to_beaches", v)} />
            <Checkbox label="Panoramic View"     checked={form.panoramic_view}     onChange={(v) => set("panoramic_view", v)} />
            <Checkbox label="Mountain View"      checked={form.mountain_view}      onChange={(v) => set("mountain_view", v)} />
            <Checkbox label="Acropolis View"     checked={form.acropolis_view}     onChange={(v) => set("acropolis_view", v)} />
          </div>
          {/* Column 2 — outdoor & building */}
          <div className="flex flex-col gap-3">
            <Checkbox label="Pool"           checked={form.pool}          onChange={(v) => set("pool", v)} />
            <Checkbox label="Garden"         checked={form.garden}        onChange={(v) => set("garden", v)} />
            <Checkbox label="Barbeque"       checked={form.barbeque}      onChange={(v) => set("barbeque", v)} />
            <Checkbox label="Security Door"  checked={form.security_door} onChange={(v) => set("security_door", v)} />
            <Checkbox label="Elevator"       checked={form.elevator}      onChange={(v) => set("elevator", v)} />
          </div>
          {/* Column 3 — security & tech */}
          <div className="flex flex-col gap-3">
            <Checkbox label="Alarm System"    checked={form.alarm_system}    onChange={(v) => set("alarm_system", v)} />
            <Checkbox label="Smoke Detection" checked={form.smoke_detection} onChange={(v) => set("smoke_detection", v)} />
            <Checkbox label="Smart Home"      checked={form.smart_home}      onChange={(v) => set("smart_home", v)} />
            <Checkbox label="Internet Ready"  checked={form.internet_ready}  onChange={(v) => set("internet_ready", v)} />
            <Checkbox label="Video Doorphone" checked={form.video_doorphone} onChange={(v) => set("video_doorphone", v)} />
            <Checkbox label="Satellite TV"    checked={form.satellite_tv}    onChange={(v) => set("satellite_tv", v)} />
          </div>
        </div>
      </Section>

      {/* ── Level Details (repeatable, driven by Number of Levels) ──────── */}
      {form.levels.map((level, idx) => (
        <Section key={idx} title={`Level ${idx + 1} Details`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Column 1 — numeric / count / room fields only */}
            <div className="flex flex-col gap-4">
              <Field label="Level Size (sqm)">
                <input type="number" value={level.level_size_sqm}
                  onChange={(e) => setLevel(idx, "level_size_sqm", e.target.value)}
                  className={inputCls} placeholder="120" min={0} />
              </Field>
              <Field label="Bedrooms">
                <input type="number" value={level.bedrooms}
                  onChange={(e) => setLevel(idx, "bedrooms", e.target.value)}
                  className={inputCls} placeholder="3" min={0} />
              </Field>
              <Field label="Bathrooms">
                <input type="number" value={level.bathrooms}
                  onChange={(e) => setLevel(idx, "bathrooms", e.target.value)}
                  className={inputCls} placeholder="2" min={0} />
              </Field>
              <Field label="WC">
                <input type="number" value={level.wc}
                  onChange={(e) => setLevel(idx, "wc", e.target.value)}
                  className={inputCls} placeholder="1" min={0} />
              </Field>
              <Field label="Kitchens">
                <input type="number" value={level.kitchens}
                  onChange={(e) => setLevel(idx, "kitchens", e.target.value)}
                  className={inputCls} placeholder="1" min={0} />
              </Field>
              <Field label="Living Rooms">
                <input type="number" value={level.living_rooms}
                  onChange={(e) => setLevel(idx, "living_rooms", e.target.value)}
                  className={inputCls} placeholder="1" min={0} />
              </Field>
              <Field label="Versatile Rooms">
                <input type="number" value={level.versatile_rooms}
                  onChange={(e) => setLevel(idx, "versatile_rooms", e.target.value)}
                  className={inputCls} placeholder="0" min={0} />
              </Field>
              <Field label="Hall">
                <input type="number" value={level.hall}
                  onChange={(e) => setLevel(idx, "hall", e.target.value)}
                  className={inputCls} placeholder="0" min={0} />
              </Field>
              <Field label="Storage Rooms">
                <input type="number" value={level.storage_rooms}
                  onChange={(e) => setLevel(idx, "storage_rooms", e.target.value)}
                  className={inputCls} placeholder="0" min={0} />
              </Field>
            </div>
            {/* Column 2 — boolean feature checkboxes */}
            <div className="flex flex-col gap-4">
              <Checkbox label="Maisonette"           checked={level.is_maisonette}        onChange={(v) => setLevel(idx, "is_maisonette", v)} />
              <Checkbox label="Wardrobe Room"        checked={level.wardrobe_room}        onChange={(v) => setLevel(idx, "wardrobe_room", v)} />
              <Checkbox label="Balcony"              checked={level.balcony}              onChange={(v) => setLevel(idx, "balcony", v)} />
              <Checkbox label="Veranda"              checked={level.veranda}              onChange={(v) => setLevel(idx, "veranda", v)} />
              <Checkbox label="Awnings"              checked={level.awnings}              onChange={(v) => setLevel(idx, "awnings", v)} />
              <Checkbox label="Private Roof Terrace" checked={level.private_roof_terrace} onChange={(v) => setLevel(idx, "private_roof_terrace", v)} />
              <Checkbox label="Loft"                 checked={level.loft}                onChange={(v) => setLevel(idx, "loft", v)} />
              <Checkbox label="Internal Staircase"   checked={level.internal_staircase}   onChange={(v) => setLevel(idx, "internal_staircase", v)} />
              <Checkbox label="Internal Elevator"    checked={level.internal_elevator}    onChange={(v) => setLevel(idx, "internal_elevator", v)} />
              <Checkbox label="Fireplace"            checked={level.fireplace}            onChange={(v) => setLevel(idx, "fireplace", v)} />
              <Checkbox label="Jacuzzi"              checked={level.jacuzzi}              onChange={(v) => setLevel(idx, "jacuzzi", v)} />
              <Checkbox label="Home Cinema"          checked={level.home_cinema}          onChange={(v) => setLevel(idx, "home_cinema", v)} />
            </div>
          </div>
        </Section>
      ))}

      {/* ── Furnished ────────────────────────────────────────────────────── */}
      <Section title="Furnished">
        <div className="flex flex-col gap-2">
          <Field label="Furnished">
            <select
              value={form.furnished}
              onChange={(e) => set("furnished", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="Fully Furnished">Fully Furnished</option>
              <option value="Partially Furnished">Partially Furnished</option>
              <option value="Not Furnished">Not Furnished</option>
              <option value="Kitchen Only">Kitchen Only</option>
              <option value="With Appliances">With Appliances</option>
            </select>
          </Field>
          <Field label="Custom Furnished" hint="Overrides dropdown on public page">
            <input
              type="text"
              value={form.custom_furnished}
              onChange={(e) => set("custom_furnished", e.target.value)}
              className={inputCls}
              placeholder="e.g. Fully furnished, luxury fittings"
            />
          </Field>
        </div>
      </Section>

      {/* ── Windows & Construction ────────────────────────────────────────── */}
      <Section title="Windows & Construction">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Frames Type">
            <select
              value={form.frames_type}
              onChange={(e) => set("frames_type", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="aluminum">Aluminum</option>
              <option value="pvc">PVC</option>
              <option value="wooden">Wooden</option>
              <option value="synthetic">Synthetic</option>
            </select>
          </Field>
          <Field label="Flooring Type">
            <select
              value={form.flooring_type}
              onChange={(e) => set("flooring_type", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="marble">Marble</option>
              <option value="tile">Tile</option>
              <option value="wooden">Wooden</option>
              <option value="parquet">Parquet</option>
              <option value="laminate">Laminate</option>
              <option value="granite">Granite</option>
              <option value="stone">Stone</option>
              <option value="cement">Cement</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1">
          {/* Column 1 — Glazing */}
          <div className="flex flex-col gap-3">
            <Checkbox label="Single Glazing"   checked={form.single_glazing}   onChange={(v) => set("single_glazing", v)} />
            <Checkbox label="Double Glazing"   checked={form.double_glazing}   onChange={(v) => set("double_glazing", v)} />
            <Checkbox label="Triple Glazing"   checked={form.triple_glazing}   onChange={(v) => set("triple_glazing", v)} />
            <Checkbox label="Mosquito Screens" checked={form.mosquito_screens} onChange={(v) => set("mosquito_screens", v)} />
          </div>
          {/* Column 2 — Insulation + Covering */}
          <div className="flex flex-col gap-3">
            <Checkbox label="Thermal Insulation" checked={form.thermal_insulation} onChange={(v) => set("thermal_insulation", v)} />
            <Checkbox label="Sound Insulation"   checked={form.sound_insulation}   onChange={(v) => set("sound_insulation", v)} />
            <Checkbox label="Blinds"             checked={form.blinds}             onChange={(v) => set("blinds", v)} />
            <Checkbox label="Electric Shutters"  checked={form.electric_shutters}  onChange={(v) => set("electric_shutters", v)} />
          </div>
        </div>
      </Section>

      {/* ── Heating & Cooling ────────────────────────────────────────────── */}
      <Section title="Heating & Cooling">
        <div className="grid grid-cols-2 gap-x-6">
          {/* LEFT COLUMN — Heating */}
          <div className="flex flex-col gap-4">
            <Field label="Heating Fuel">
              <select value={form.heating_fuel} onChange={(e) => set("heating_fuel", e.target.value)} className={inputCls}>
                <option value="">— select —</option>
                <option value="oil">Oil</option>
                <option value="natural_gas">Natural Gas</option>
                <option value="electric">Electric</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Heating System">
              <select value={form.heating_system} onChange={(e) => set("heating_system", e.target.value)} className={inputCls}>
                <option value="">— select —</option>
                <option value="central">Central Heating</option>
                <option value="central_autonomous">Central with Autonomy</option>
                <option value="autonomous">Autonomous Heating</option>
                <option value="heat_pump">Heat Pump</option>
                <option value="underfloor">Underfloor Heating</option>
                <option value="fan_coil">Fan Coil</option>
                <option value="storage_heaters">Storage Heaters</option>
                <option value="pellet_wood_stove">Pellet / Wood Stove</option>
                <option value="energy_fireplace">Energy Fireplace</option>
                <option value="none">No Heating</option>
              </select>
            </Field>
            <Field label="Custom Heating" hint="Overrides the selected value on the public page">
              <input type="text" value={form.custom_heating} onChange={(e) => set("custom_heating", e.target.value)} className={inputCls} placeholder="e.g. Pellet stove + underfloor" />
            </Field>
          </div>
          {/* RIGHT COLUMN — Cooling + Features */}
          <div className="flex flex-col gap-4">
            <Field label="Cooling / AC">
              <select value={form.cooling_system} onChange={(e) => set("cooling_system", e.target.value)} className={inputCls}>
                <option value="">— select —</option>
                <option value="central_ac">Central AC</option>
                <option value="split_units">Split Units</option>
                <option value="fan_coil">Fan Coil</option>
                <option value="heat_pump">Heat Pump</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Additional Features">
              <div className="flex flex-wrap gap-2 pt-1">
                {([
                  { value: "photovoltaic",       label: "Photovoltaic Panels" },
                  { value: "solar_water_heater", label: "Solar Water Heater" },
                ] as const).map(({ value, label }) => {
                  const active = form.heating_features.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? form.heating_features.filter((f) => f !== value)
                          : [...form.heating_features, value];
                        set("heating_features", next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                          : "bg-white text-[#888888] border-[#E8E8E8] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Custom Cooling" hint="Overrides the selected value on the public page">
              <input type="text" value={form.custom_cooling} onChange={(e) => set("custom_cooling", e.target.value)} className={inputCls} placeholder="e.g. VRF system" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Electricity ──────────────────────────────────────────────────── */}
      <Section title="Electricity">
        <div className="flex flex-wrap gap-2">
          {([
            { value: "night_tariff",     label: "Night Tariff"     },
            { value: "single_phase",     label: "Single Phase"     },
            { value: "three_phase",      label: "Three Phase"      },
            { value: "industrial_power", label: "Industrial Power" },
          ] as const).map(({ value, label }) => {
            const active = form.electricity.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const next = active
                    ? form.electricity.filter((v) => v !== value)
                    : [...form.electricity, value];
                  set("electricity", next);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                    : "bg-white text-[#888888] border-[#E8E8E8] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Parking ───────────────────────────────────────────────────────── */}
      <Section title="Parking">
        <Checkbox label="Parking" checked={form.parking} onChange={(v) => set("parking", v)} />
        {form.parking && (
          <div className="flex flex-col gap-4 pt-2">
            {/* Row 1 — Spaces + Type */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Parking Spaces">
                <input
                  type="number"
                  value={form.parking_spaces}
                  onChange={(e) => set("parking_spaces", e.target.value)}
                  className={inputCls}
                  placeholder="1"
                  min={0}
                />
              </Field>
              <Field label="Parking Type">
                <select
                  value={form.parking_type}
                  onChange={(e) => set("parking_type", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— select —</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="covered">Covered</option>
                  <option value="underground">Underground</option>
                  <option value="closed_garage">Closed Garage</option>
                  <option value="pilotis">Pilotis</option>
                </select>
              </Field>
            </div>
            {/* Row 2 — Level + Area */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Parking Level">
                <select
                  value={form.parking_level}
                  onChange={(e) => set("parking_level", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— select —</option>
                  <option value="b4">B4</option>
                  <option value="b3">B3</option>
                  <option value="b2">B2</option>
                  <option value="b1">B1</option>
                  <option value="ground_floor">Ground Floor</option>
                  <option value="level_1">Level 1</option>
                  <option value="level_2">Level 2</option>
                  <option value="level_3">Level 3</option>
                  <option value="level_4">Level 4</option>
                </select>
              </Field>
              <Field label="Parking Area (sqm)">
                <input
                  type="number"
                  value={form.parking_area_sqm}
                  onChange={(e) => set("parking_area_sqm", e.target.value)}
                  className={inputCls}
                  placeholder="20"
                  min={0}
                />
              </Field>
            </div>
            {/* Row 3 — Suitable for (chips) */}
            <Field label="Suitable for">
              <div className="flex flex-wrap gap-2 pt-1">
                {([
                  { value: "cars",        label: "Cars" },
                  { value: "motorcycles", label: "Motorcycles" },
                  { value: "boats",       label: "Boats" },
                  { value: "camper_vans", label: "Camper Vans" },
                  { value: "trucks",      label: "Trucks" },
                ] as const).map(({ value, label }) => {
                  const active = form.parking_suitable_for.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? form.parking_suitable_for.filter((f) => f !== value)
                          : [...form.parking_suitable_for, value];
                        set("parking_suitable_for", next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                          : "bg-white text-[#888888] border-[#E8E8E8] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
            {/* Row 4 — Parking Features (chips) */}
            <Field label="Parking Features">
              <div className="flex flex-wrap gap-2 pt-1">
                {([
                  { value: "electric_gate",   label: "Electric Gate" },
                  { value: "car_lift",         label: "Car Lift" },
                  { value: "alarm_system",     label: "Alarm System" },
                  { value: "fire_protection",  label: "Fire Protection" },
                  { value: "ev_charging",      label: "EV Charging" },
                ] as const).map(({ value, label }) => {
                  const active = form.parking_features.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? form.parking_features.filter((f) => f !== value)
                          : [...form.parking_features, value];
                        set("parking_features", next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                          : "bg-white text-[#888888] border-[#E8E8E8] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}
      </Section>

      {/* ── Description ───────────────────────────────────────────────────── */}
      <Section title="Description">
        <Field label="Summary" hint="5–7 lines">
          <textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className={textareaCls}
            placeholder="Short overview of the property..."
          />
        </Field>
        <Field label="Full Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${textareaCls} min-h-40`}
            placeholder="Detailed property description..."
          />
        </Field>
      </Section>

      {/* ── Media ─────────────────────────────────────────────────────────── */}
      <Section title="Media">
        <PropertyImageUpload
          propertyCode={propertyCode}
          propertyId={mode === "edit" ? propertyId : undefined}
          initialCoverUrl={form.cover_image_url || null}
          initialGalleryUrls={form.gallery_image_urls}
          onChange={({ coverUrl, galleryUrls }) => {
            setForm((prev) => ({
              ...prev,
              cover_image_url: coverUrl,
              gallery_image_urls: galleryUrls,
            }));
          }}
        />
        <p className="text-xs text-[#AAAAAA]">Recommended: 1200×800px · JPG or WebP · at least 1 photo required to publish</p>
        <Field label="YouTube Video URL" hint="optional">
          <input
            type="url"
            value={form.youtube_video_url}
            onChange={(e) => set("youtube_video_url", e.target.value)}
            className={inputCls}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Field>
        <Field label="Virtual Tour URL" hint="optional">
          <input
            type="url"
            value={form.virtual_tour_url}
            onChange={(e) => set("virtual_tour_url", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>
      </Section>

      {/* ── Location / Map ────────────────────────────────────────────────── */}
      <Section title="Map">
        <p className="text-xs text-[#AAAAAA] -mt-1">
          The Location field above controls area filtering in the catalogue. Address and coordinates here control the map pin shown on the property page.
        </p>
        {/* Address lookup */}
        <Field label="Address" hint="optional — used to look up coordinates">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.address}
              onChange={(e) => { set("address", e.target.value); setGeoStatus("idle"); }}
              className={inputCls}
              placeholder="e.g. 10 Voukourestiou, Athens"
            />
            <button
              type="button"
              onClick={lookupCoordinates}
              disabled={!form.address.trim() || geoStatus === "loading"}
              className="shrink-0 px-4 py-2 bg-[#1E1E1E] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-40 disabled:cursor-default whitespace-nowrap"
            >
              {geoStatus === "loading" ? "Searching…" : "Get coordinates"}
            </button>
          </div>
          {geoStatus === "found"     && <p className="text-xs text-green-600 mt-1">Coordinates updated.</p>}
          {geoStatus === "not_found" && (
            <p className="text-xs text-amber-600 mt-1">
              Address not found.{" "}
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(form.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-800"
              >
                Open in Google Maps
              </a>
              {" "}to locate manually, then right-click the pin → "What&apos;s here?" to copy coordinates.
            </p>
          )}
          {geoStatus === "error"     && <p className="text-xs text-red-600 mt-1">Lookup failed. Check connection or enter coordinates manually.</p>}
        </Field>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude" hint="optional">
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              className={inputCls}
              placeholder="37.9838"
            />
          </Field>
          <Field label="Longitude" hint="optional">
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              className={inputCls}
              placeholder="23.7275"
            />
          </Field>
        </div>
        <Checkbox
          label="Approximate location"
          checked={form.approximate_location}
          onChange={(v) => set("approximate_location", v)}
          hint="Hides the exact pin on the public map — shows only the general area"
        />
        <Checkbox
          label="Show address to visitors"
          checked={form.show_address}
          onChange={(v) => set("show_address", v)}
          hint="If disabled, the exact address stays hidden on the public page."
        />
      </Section>

      {/* ── Premium Control ───────────────────────────────────────────────── */}
      <Section title="Premium Control">
        <div className="flex flex-col gap-3">
          <Checkbox label="Golden Visa" checked={form.is_golden_visa} onChange={(v) => set("is_golden_visa", v)} />
          <Checkbox label="Featured" checked={form.featured} onChange={(v) => set("featured", v)} />
          <Checkbox
            label="Private Collection"
            checked={form.private_collection}
            onChange={(v) => set("private_collection", v)}
            hint="Hidden from public catalogue — accessible only via private link"
          />
        </div>
      </Section>

      {/* ── Custom Badge ──────────────────────────────────────────────────── */}
      <Section title="Custom Badge">
        <p className="text-xs text-[#AAAAAA] -mt-1">
          Optional badge shown on the property card and detail page. Select from the dictionary or create a new one.
        </p>
        <Field label="Badge">
          <div className="flex flex-col gap-1">
            <select
              value={form.custom_badge}
              onChange={(e) => set("custom_badge", e.target.value)}
              className={inputCls}
            >
              <option value="">— no badge —</option>
              {localBadges.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowBadgeModal(true)}
              className="text-sm font-medium text-[#C1121F] hover:opacity-70 transition-opacity self-start"
            >
              + Add new badge
            </button>
          </div>
        </Field>

        {form.custom_badge && (
          <Field label="Badge Color">
            <div className="flex gap-2 flex-wrap">
              {BADGE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("custom_badge_color", c.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition ${
                    form.custom_badge_color === c.value
                      ? "border-[#1E1E1E]"
                      : "border-transparent hover:border-[#D9D9D9]"
                  }`}
                >
                  <span
                    className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded"
                    style={getBadgeStyle(c.value)}
                  >
                    {form.custom_badge}
                  </span>
                </button>
              ))}
            </div>
          </Field>
        )}
      </Section>

      {/* ── Additional Information ────────────────────────────────────────── */}
      <Section title="Additional Information">
        <Field label="Agent Notes" hint="internal only — not shown publicly">
          <textarea
            value={form.agent_notes}
            onChange={(e) => set("agent_notes", e.target.value)}
            className={textareaCls}
            placeholder="Notes visible only to the admin team..."
          />
        </Field>
      </Section>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
        >
          {loading ? "Saving…" : mode === "edit" ? "Update Property" : "Save Property"}
        </button>
      </div>

      {/* ── Quick-create area modal ──────────────────────────────────────── */}
      {showAreaModal && (
        <QuickAreaModal
          existingGroups={Array.from(new Set(localAreas.map((a) => a.group_name)))}
          onSuccess={(area) => {
            setLocalAreas((prev) =>
              [...prev, area].sort(
                (a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name)
              )
            );
            setForm((prev) => ({ ...prev, location_slug: area.slug, location_text: area.name }));
            setShowAreaModal(false);
          }}
          onClose={() => setShowAreaModal(false)}
        />
      )}

      {/* ── Quick-create badge modal ──────────────────────────────────────── */}
      {showBadgeModal && (
        <QuickBadgeModal
          onSuccess={(badge, color) => {
            setLocalBadges((prev) => [...prev, badge].sort((a, b) => a.name.localeCompare(b.name)));
            setForm((prev) => ({ ...prev, custom_badge: badge.name, custom_badge_color: color }));
            setShowBadgeModal(false);
          }}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

    </form>
  );
}
