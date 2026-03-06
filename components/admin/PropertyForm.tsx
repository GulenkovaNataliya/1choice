"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/logActivity";
import PropertyImageUpload from "@/components/admin/PropertyImageUpload";

// ── Types ─────────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  slug: string;
  price_eur: string;
  location_text: string;
  size_sqm: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  summary: string;
  description: string;
  is_golden_visa: boolean;
  featured: boolean;
  vip: boolean;
  publish_1choice: boolean;
  publish_deals: boolean;
  status: "draft" | "published" | "archived";
  cover_image_url: string;
  gallery_image_urls: string[];
  latitude: string;
  longitude: string;
  approximate_location: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const INITIAL: FormState = {
  title: "",
  slug: "",
  price_eur: "",
  location_text: "",
  size_sqm: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  summary: "",
  description: "",
  is_golden_visa: false,
  featured: false,
  vip: false,
  publish_1choice: true,
  publish_deals: false,
  status: "draft",
  cover_image_url: "",
  gallery_image_urls: [],
  latitude: "",
  longitude: "",
  approximate_location: false,
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
    price_eur: form.price_eur ? Number(form.price_eur) : null,
    location_text: form.location_text || null,
    size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
    floor: form.floor ? Number(form.floor) : null,
    summary: form.summary || null,
    description: form.description || null,
    is_golden_visa: form.is_golden_visa,
    featured: form.featured,
    vip: form.vip,
    publish_1choice: form.publish_1choice,
    publish_deals: form.publish_deals,
    status: form.status,
    cover_image_url: form.cover_image_url || null,
    gallery_image_urls: form.gallery_image_urls,
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    approximate_location: form.approximate_location,
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
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[#D9D9D9] accent-[#1E1E1E]"
      />
      <span className="text-sm text-[#1E1E1E]">{label}</span>
    </label>
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

// ── Component ─────────────────────────────────────────────────────────────────

type Props =
  | { mode?: "create"; propertyCode: string; propertyId?: never; initialValues?: never }
  | { mode: "edit"; propertyId: string; propertyCode: string; initialValues: Partial<FormState> };

export default function PropertyForm({ mode = "create", propertyCode, propertyId, initialValues }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Tracks the JSON snapshot of the last successfully autosaved state
  const lastSavedRef = useRef<string>(JSON.stringify({ ...INITIAL, ...initialValues }));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Capture the slug as it was when the edit page loaded — never changes
  const originalSlugRef = useRef<string>(initialValues?.slug?.trim() ?? "");

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Autosave ────────────────────────────────────────────────────────────────

  const autosave = useCallback(async (snapshot: FormState) => {
    if (mode !== "edit" || snapshot.status !== "draft") return;

    const current = JSON.stringify(snapshot);
    if (current === lastSavedRef.current) return; // nothing changed

    setSaveStatus("saving");
    try {
      const { error: dbError } = await getSupabase()
        .from("properties")
        .update(buildPayload(snapshot))
        .eq("id", propertyId);

      if (dbError) {
        setSaveStatus("error");
      } else {
        lastSavedRef.current = current;
        setSaveStatus("saved");
        logActivity(propertyId!, "update", { autosave: true });
      }
    } catch {
      setSaveStatus("error");
    }
  }, [mode, propertyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Autosave only in edit mode for drafts
    if (mode !== "edit" || form.status !== "draft") return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      autosave(form);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form]); // intentionally omit stable refs/callbacks — form changes are the trigger

  // ── Manual submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Cancel any pending autosave
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const supabase = getSupabase();
      let dbError;

      if (mode === "edit") {
        const newSlug = form.slug.trim() || toSlug(form.title);
        const originalSlug = originalSlugRef.current;
        const slugChanged = originalSlug && newSlug !== originalSlug;

        // Insert slug redirect before updating the property
        if (slugChanged) {
          try {
            await supabase.from("property_slug_redirects").insert({
              old_slug: originalSlug,
              property_id: propertyId,
            });
          } catch {
            // Ignore — duplicate old_slug or any other error must not block the update
          }
        }

        const { error } = await supabase
          .from("properties")
          .update(buildPayload(form, true))
          .eq("id", propertyId);
        dbError = error;
        if (!error) {
          const meta = slugChanged
            ? { slug_changed: true, from: originalSlug, to: newSlug }
            : { updated: true };
          logActivity(propertyId!, "update", meta);
          // Move the baseline forward so future edits don't re-insert the same redirect
          if (slugChanged) originalSlugRef.current = newSlug;
        }
      } else {
        const { data: created, error } = await supabase
          .from("properties")
          .insert({ property_code: propertyCode, ...buildPayload(form, true) })
          .select("id")
          .single();
        dbError = error;
        if (!error && created?.id) logActivity(created.id, "create", { title: form.title });
      }

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      router.push("/admin/properties");
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isDraft = form.status === "draft";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Autosave status bar — edit + draft only */}
      {mode === "edit" && isDraft && (
        <div className="flex items-center justify-between bg-white border border-[#E8E8E8] rounded-lg px-4 py-2.5">
          <span className="text-xs text-[#AAAAAA]">Autosave enabled (draft)</span>
          <SaveIndicator status={saveStatus} />
        </div>
      )}

      {/* Property Code */}
      <div className="bg-white border border-[#E8E8E8] rounded-lg px-4 py-2.5">
        <span className="text-xs text-[#AAAAAA]">Property Code: </span>
        <span className="text-xs font-mono font-semibold text-[#1E1E1E]">{propertyCode}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Section title="Basic Info">
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
        <Field label="Slug" hint="auto-generated from title if left empty">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={inputCls}
            placeholder="e.g. luxury-villa-santorini"
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
            <input
              type="text"
              value={form.location_text}
              onChange={(e) => set("location_text", e.target.value)}
              className={inputCls}
              placeholder="e.g. Athens"
            />
          </Field>
        </div>
      </Section>

      {/* Characteristics */}
      <Section title="Characteristics">
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

      {/* Description */}
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
            className={`${textareaCls} min-h-[160px]`}
            placeholder="Detailed property description..."
          />
        </Field>
      </Section>

      {/* Flags */}
      <Section title="Flags">
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="Golden Visa" checked={form.is_golden_visa} onChange={(v) => set("is_golden_visa", v)} />
          <Checkbox label="Featured" checked={form.featured} onChange={(v) => set("featured", v)} />
          <Checkbox label="VIP" checked={form.vip} onChange={(v) => set("vip", v)} />
        </div>
      </Section>

      {/* Publishing */}
      <Section title="Publishing">
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Checkbox label="Publish on 1Choice" checked={form.publish_1choice} onChange={(v) => set("publish_1choice", v)} />
          <Checkbox label="Publish on Deals" checked={form.publish_deals} onChange={(v) => set("publish_deals", v)} />
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

      {/* Map */}
      <Section title="Map">
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
        />
      </Section>

      {/* Media */}
      <Section title="Media">
        <PropertyImageUpload
          propertyCode={propertyCode}
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
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
        >
          {loading ? "Saving…" : mode === "edit" ? "Update Property" : "Save Property"}
        </button>
      </div>

    </form>
  );
}
