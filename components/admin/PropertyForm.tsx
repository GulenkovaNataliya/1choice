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

// ── Types ─────────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  slug: string;
  category: string;
  subtype: string;
  transaction_type: string;
  price_eur: string;
  location_slug: string;
  location_text: string;
  size_sqm: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  year_built: string;
  year_renovated: string;
  building_condition: string;
  energy_class: string;
  fireplace: boolean;
  elevator: boolean;
  security_door: boolean;
  alarm_system: boolean;
  video_doorphone: boolean;
  smart_home: boolean;
  satellite_tv: boolean;
  internet_ready: boolean;
  storage: boolean;
  sea_view: boolean;
  mountain_view: boolean;
  garden: boolean;
  pool: boolean;
  frames_type: string;
  double_glazing: boolean;
  triple_glazing: boolean;
  mosquito_screens: boolean;
  thermal_insulation: boolean;
  sound_insulation: boolean;
  flooring_type: string;
  living_rooms: string;
  kitchens: string;
  storage_rooms: string;
  wc: string;
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
  custom_badge: string;
  custom_badge_color: string;
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
  size_sqm: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  year_built: "",
  year_renovated: "",
  building_condition: "",
  energy_class: "",
  fireplace: false,
  elevator: false,
  security_door: false,
  alarm_system: false,
  video_doorphone: false,
  smart_home: false,
  satellite_tv: false,
  internet_ready: false,
  storage: false,
  sea_view: false,
  mountain_view: false,
  garden: false,
  pool: false,
  frames_type: "",
  double_glazing: false,
  triple_glazing: false,
  mosquito_screens: false,
  thermal_insulation: false,
  sound_insulation: false,
  flooring_type: "",
  living_rooms: "",
  kitchens: "",
  storage_rooms: "",
  wc: "",
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
  custom_badge: "",
  custom_badge_color: "red",
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

function buildPayload(form: FormState, resolveSlug = false) {
  return {
    title: form.title,
    slug: resolveSlug ? (form.slug.trim() || toSlug(form.title)) : (form.slug || null),
    category: form.category || null,
    subtype: form.subtype || null,
    transaction_type: form.transaction_type || null,
    price_eur: form.price_eur ? Number(form.price_eur) : null,
    location: form.location_slug || null,
    location_text: form.location_text || null,
    size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
    floor: form.floor ? Number(form.floor) : null,
    year_built: form.year_built ? Number(form.year_built) : null,
    year_renovated: form.year_renovated ? Number(form.year_renovated) : null,
    building_condition: form.building_condition || null,
    energy_class: form.energy_class || null,
    fireplace: form.fireplace,
    elevator: form.elevator,
    security_door: form.security_door,
    alarm_system: form.alarm_system,
    video_doorphone: form.video_doorphone,
    smart_home: form.smart_home,
    satellite_tv: form.satellite_tv,
    internet_ready: form.internet_ready,
    storage: form.storage,
    sea_view: form.sea_view,
    mountain_view: form.mountain_view,
    garden: form.garden,
    pool: form.pool,
    frames_type: form.frames_type || null,
    double_glazing: form.double_glazing,
    triple_glazing: form.triple_glazing,
    mosquito_screens: form.mosquito_screens,
    thermal_insulation: form.thermal_insulation,
    sound_insulation: form.sound_insulation,
    flooring_type: form.flooring_type || null,
    living_rooms: form.living_rooms ? Number(form.living_rooms) : null,
    kitchens: form.kitchens ? Number(form.kitchens) : null,
    storage_rooms: form.storage_rooms ? Number(form.storage_rooms) : null,
    wc: form.wc ? Number(form.wc) : null,
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
    custom_badge: form.custom_badge || null,
    custom_badge_color: form.custom_badge ? (form.custom_badge_color || "red") : null,
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
  onSuccess: (badge: Badge) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
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
    onSuccess(result);
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

        {trimmed && !tooLong && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#AAAAAA]">Preview:</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={getBadgeStyle("red")}
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

    // ── Publish validation ───────────────────────────────────────────────────
    if (form.status === "published") {
      const errs: string[] = [];
      if (!form.title.trim())              errs.push("Title is required.");
      if (!form.price_eur)                 errs.push("Price is required.");
      if (!form.category)                  errs.push("Category is required.");
      if (!form.gallery_image_urls.length) errs.push("At least 1 photo is required to publish.");
      if (!form.description.trim() && !form.summary.trim())
                                           errs.push("Description or summary is required to publish.");
      if (errs.length > 0) {
        setError(errs.join(" "));
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
        const { data: created, error } = await supabase
          .from("properties")
          .insert({ property_code: propertyCode, ...buildPayload(form, true) })
          .select("id")
          .single();
        dbError = error;
        if (!error && created?.id) logActivity(created.id, "property_created", { title: form.title, property_code: propertyCode });
      }

      if (dbError) {
        console.error("[PropertyForm] save error:", dbError);
        setError("Failed to save property. Please try again.");
        setSaveStatus("error");
        setLoading(false);
        return;
      }

      lastSavedRef.current = JSON.stringify(form);
      setSaveStatus("saved");
      router.push("/admin/properties");
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ── Main Block ─────────────────────────────────────────────────────── */}
      <Section title="Main Block">
        <Field label="Title">
          <input
            type="text"
            required
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              <option value="">— select —</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="hotel">Hotel / Hospitality</option>
            </select>
          </Field>
          <Field label="Transaction Type">
            <select
              value={form.transaction_type}
              onChange={(e) => set("transaction_type", e.target.value)}
              className={inputCls}
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </Field>
        </div>
        <Field label="Subtype" hint="e.g. apartment, villa, studio, office">
          <input
            type="text"
            value={form.subtype}
            onChange={(e) => set("subtype", e.target.value)}
            className={inputCls}
            placeholder="e.g. villa"
          />
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
                className="text-xs text-[#3A2E4F] hover:underline self-start"
              >
                + Add new area
              </button>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Basic Characteristics ──────────────────────────────────────────── */}
      <Section title="Basic Characteristics">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Size (sqm)">
            <input
              type="number"
              value={form.size_sqm}
              onChange={(e) => set("size_sqm", e.target.value)}
              className={inputCls}
              placeholder="120"
              min={0}
            />
          </Field>
          <Field label="Bedrooms">
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className={inputCls}
              placeholder="3"
              min={0}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className={inputCls}
              placeholder="2"
              min={0}
            />
          </Field>
          <Field label="Floor">
            <input
              type="number"
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
              className={inputCls}
              placeholder="3"
              min={0}
            />
          </Field>
        </div>
      </Section>

      {/* ── Building Information ──────────────────────────────────────────── */}
      <Section title="Building Information">
        <div className="grid grid-cols-2 gap-4">
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

      {/* ── Comfort & Amenities ───────────────────────────────────────────── */}
      <Section title="Comfort & Amenities">
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="Fireplace"       checked={form.fireplace}       onChange={(v) => set("fireplace", v)} />
          <Checkbox label="Elevator"        checked={form.elevator}        onChange={(v) => set("elevator", v)} />
          <Checkbox label="Security Door"   checked={form.security_door}   onChange={(v) => set("security_door", v)} />
          <Checkbox label="Alarm System"    checked={form.alarm_system}    onChange={(v) => set("alarm_system", v)} />
          <Checkbox label="Video Doorphone" checked={form.video_doorphone} onChange={(v) => set("video_doorphone", v)} />
          <Checkbox label="Smart Home"      checked={form.smart_home}      onChange={(v) => set("smart_home", v)} />
          <Checkbox label="Satellite TV"    checked={form.satellite_tv}    onChange={(v) => set("satellite_tv", v)} />
          <Checkbox label="Internet Ready"  checked={form.internet_ready}  onChange={(v) => set("internet_ready", v)} />
          <Checkbox label="Storage"         checked={form.storage}         onChange={(v) => set("storage", v)} />
          <Checkbox label="Pool"            checked={form.pool}            onChange={(v) => set("pool", v)} />
          <Checkbox label="Garden"          checked={form.garden}          onChange={(v) => set("garden", v)} />
          <Checkbox label="Sea View"        checked={form.sea_view}        onChange={(v) => set("sea_view", v)} />
          <Checkbox label="Mountain View"   checked={form.mountain_view}   onChange={(v) => set("mountain_view", v)} />
        </div>
      </Section>

      {/* ── Layout & Rooms ────────────────────────────────────────────────── */}
      <Section title="Layout & Rooms">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Living Rooms">
            <input
              type="number"
              value={form.living_rooms}
              onChange={(e) => set("living_rooms", e.target.value)}
              className={inputCls}
              placeholder="1"
              min={0}
            />
          </Field>
          <Field label="Kitchens">
            <input
              type="number"
              value={form.kitchens}
              onChange={(e) => set("kitchens", e.target.value)}
              className={inputCls}
              placeholder="1"
              min={0}
            />
          </Field>
          <Field label="WC">
            <input
              type="number"
              value={form.wc}
              onChange={(e) => set("wc", e.target.value)}
              className={inputCls}
              placeholder="1"
              min={0}
            />
          </Field>
          <Field label="Storage Rooms">
            <input
              type="number"
              value={form.storage_rooms}
              onChange={(e) => set("storage_rooms", e.target.value)}
              className={inputCls}
              placeholder="0"
              min={0}
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
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Checkbox label="Double Glazing" checked={form.double_glazing} onChange={(v) => set("double_glazing", v)} />
          <Checkbox label="Triple Glazing" checked={form.triple_glazing} onChange={(v) => set("triple_glazing", v)} />
          <Checkbox label="Mosquito Screens" checked={form.mosquito_screens} onChange={(v) => set("mosquito_screens", v)} />
          <Checkbox label="Thermal Insulation" checked={form.thermal_insulation} onChange={(v) => set("thermal_insulation", v)} />
          <Checkbox label="Sound Insulation" checked={form.sound_insulation} onChange={(v) => set("sound_insulation", v)} />
        </div>
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
        <p className="text-xs text-[#AAAAAA]">Recommended: 1200×800px · JPG or WebP · max 20 images · at least 1 photo required to publish</p>
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
              className="text-xs text-[#3A2E4F] hover:underline self-start"
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
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
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
          onSuccess={(badge) => {
            setLocalBadges((prev) => [...prev, badge].sort((a, b) => a.name.localeCompare(b.name)));
            setForm((prev) => ({ ...prev, custom_badge: badge.name, custom_badge_color: prev.custom_badge_color || "red" }));
            setShowBadgeModal(false);
          }}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

    </form>
  );
}
