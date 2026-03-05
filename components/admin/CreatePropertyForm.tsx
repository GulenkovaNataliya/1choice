"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

// ── Property code generator ──────────────────────────────────────────────────

async function generatePropertyCode(
  supabase: ReturnType<typeof getSupabase>
): Promise<string> {
  const { data } = await supabase
    .from("properties")
    .select("property_code")
    .not("property_code", "is", null)
    .order("property_code", { ascending: false })
    .limit(1)
    .single();

  if (!data?.property_code) return "code0001";

  const match = String(data.property_code).match(/(\d+)$/);
  const n = match ? parseInt(match[1], 10) : 0;
  return "code" + String(n + 1).padStart(4, "0");
}

// ── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  slug: string;
  price_eur: string;
  location_text: string;
  is_golden_visa: boolean;
  featured: boolean;
  vip: boolean;
  publish_1choice: boolean;
  publish_deals: boolean;
  summary: string;
  description: string;
  size_sqm: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  cover_image_url: string;
};

const INITIAL: FormState = {
  title: "",
  slug: "",
  price_eur: "",
  location_text: "",
  is_golden_visa: false,
  featured: false,
  vip: false,
  publish_1choice: false,
  publish_deals: false,
  summary: "",
  description: "",
  size_sqm: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  cover_image_url: "",
};

// ── UI helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[#3A2E4F] uppercase tracking-widest border-b border-[#F0F0F0] pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1E1E1E]">
        {label}
        {hint && <span className="ml-1.5 text-xs text-[#888888] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-[#D9D9D9] rounded-xl px-4 py-2.5 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#3A2E4F] transition";

const textareaCls =
  "w-full border border-[#D9D9D9] rounded-xl px-4 py-2.5 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#3A2E4F] transition resize-y min-h-[100px]";

function CheckboxField({
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
        className="w-4 h-4 rounded border-[#D9D9D9] accent-[#3A2E4F]"
      />
      <span className="text-sm text-[#1E1E1E]">{label}</span>
    </label>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreatePropertyForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const property_code = await generatePropertyCode(supabase);

      const { error: insertError } = await supabase.from("properties").insert({
        property_code,
        slug: form.slug,
        title: form.title,
        price_eur: form.price_eur ? Number(form.price_eur) : null,
        location_text: form.location_text || null,
        summary: form.summary || null,
        description: form.description || null,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floor: form.floor ? Number(form.floor) : null,
        cover_image_url: form.cover_image_url || null,
        is_golden_visa: form.is_golden_visa,
        featured: form.featured,
        vip: form.vip,
        publish_1choice: form.publish_1choice,
        publish_deals: form.publish_deals,
        status: "draft",
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push("/admin/properties");
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Basic Info */}
      <Section title="Basic Info">
        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="e.g. Luxury Villa in Santorini"
          />
        </Field>
        <Field label="Slug" hint="URL identifier">
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
              placeholder="e.g. 450000"
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
              placeholder="e.g. 120"
              min={0}
            />
          </Field>
          <Field label="Bedrooms">
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className={inputCls}
              placeholder="e.g. 3"
              min={0}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className={inputCls}
              placeholder="e.g. 2"
              min={0}
            />
          </Field>
          <Field label="Floor">
            <input
              type="number"
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
              className={inputCls}
              placeholder="e.g. 3"
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
          <CheckboxField
            label="Golden Visa"
            checked={form.is_golden_visa}
            onChange={(v) => set("is_golden_visa", v)}
          />
          <CheckboxField
            label="Featured"
            checked={form.featured}
            onChange={(v) => set("featured", v)}
          />
          <CheckboxField
            label="VIP"
            checked={form.vip}
            onChange={(v) => set("vip", v)}
          />
          <CheckboxField
            label="Publish on 1Choice"
            checked={form.publish_1choice}
            onChange={(v) => set("publish_1choice", v)}
          />
          <CheckboxField
            label="Publish on Deals"
            checked={form.publish_deals}
            onChange={(v) => set("publish_deals", v)}
          />
        </div>
      </Section>

      {/* Media */}
      <Section title="Media">
        <Field label="Cover Image URL" hint="Paste full URL — upload coming later">
          <input
            type="url"
            value={form.cover_image_url}
            onChange={(e) => set("cover_image_url", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>
      </Section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#3A2E4F] text-[#D9D9D9] px-8 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-default"
        >
          {loading ? "Saving…" : "Save Draft"}
        </button>
      </div>

    </form>
  );
}
