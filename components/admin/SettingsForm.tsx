"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/settings/fetchSettings";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const inputCls =
  "w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition";

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
        {hint && (
          <span className="ml-2 text-xs text-[#AAAAAA] font-normal">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

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

type Props = { initialValues: SiteSettings };

export default function SettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<SiteSettings>(initialValues);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function set<K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    setErrorMsg(null);

    try {
      const { error } = await getSupabase()
        .from("site_settings")
        .upsert(
          {
            id: 1,
            company_name:        form.company_name        || null,
            registration_number: form.registration_number || null,
            company_address:     form.company_address     || null,
            contact_phone:       form.contact_phone       || null,
            contact_email:       form.contact_email       || null,
            office_hours:        form.office_hours        || null,
            logo_url:            form.logo_url            || null,
            updated_at:          new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("[SettingsForm] save error:", error);
        setErrorMsg("Failed to save settings. Please try again.");
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    } catch (err) {
      console.error("[SettingsForm] unexpected error:", err);
      setErrorMsg("An unexpected error occurred. Check your connection and try again.");
      setSaveStatus("error");
    }
  }

  const statusLabel =
    saveStatus === "saving" ? "Saving…"
    : saveStatus === "saved"  ? "Saved"
    : saveStatus === "error"  ? "Error saving"
    : null;

  const statusColor =
    saveStatus === "saving" ? "text-gray-400"
    : saveStatus === "saved"  ? "text-green-600"
    : "text-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Action bar */}
      <div className="flex items-center justify-between bg-white border border-[#E8E8E8] rounded-lg px-4 py-2.5 gap-3">
        <span className="text-sm font-semibold text-[#1E1E1E]">Site Settings</span>
        <div className="flex items-center gap-3">
          {statusLabel && (
            <span className={`text-sm transition-colors ${statusColor}`}>{statusLabel}</span>
          )}
          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className="px-4 py-1.5 bg-[#1E1E1E] text-white text-xs font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
          >
            {saveStatus === "saving" ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Company Info */}
      <Section title="Company Info">
        <Field label="Company Name">
          <input
            type="text"
            value={form.company_name ?? ""}
            onChange={(e) => set("company_name", e.target.value || null)}
            className={inputCls}
            placeholder="1Choice Real Estate"
          />
        </Field>
        <Field label="Registration Number" hint="optional">
          <input
            type="text"
            value={form.registration_number ?? ""}
            onChange={(e) => set("registration_number", e.target.value || null)}
            className={inputCls}
            placeholder="GEMI / registration number"
          />
        </Field>
        <Field label="Company Address" hint="optional">
          <input
            type="text"
            value={form.company_address ?? ""}
            onChange={(e) => set("company_address", e.target.value || null)}
            className={inputCls}
            placeholder="Athens, Greece"
          />
        </Field>
      </Section>

      {/* Contact Details */}
      <Section title="Contact Details">
        <Field label="Phone">
          <input
            type="tel"
            value={form.contact_phone ?? ""}
            onChange={(e) => set("contact_phone", e.target.value || null)}
            className={inputCls}
            placeholder="+30 210 000 0000"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.contact_email ?? ""}
            onChange={(e) => set("contact_email", e.target.value || null)}
            className={inputCls}
            placeholder="contact@1choice.gr"
          />
        </Field>
        <Field label="Office Hours" hint="optional — shown on Contact page">
          <input
            type="text"
            value={form.office_hours ?? ""}
            onChange={(e) => set("office_hours", e.target.value || null)}
            className={inputCls}
            placeholder="Mon–Fri 09:00–18:00, Sat by appointment"
          />
        </Field>
      </Section>

      {/* Branding */}
      <Section title="Branding / Assets">
        <Field label="Logo URL" hint="optional — full URL to logo image">
          <input
            type="url"
            value={form.logo_url ?? ""}
            onChange={(e) => set("logo_url", e.target.value || null)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>
        <p className="text-xs text-[#AAAAAA]">
          Favicon and brand colour management are deferred to a future step.
        </p>
      </Section>

      {/* Integrations — deferred */}
      <Section title="Integrations">
        <p className="text-sm text-[#BBBBBB]">
          Third-party integrations (analytics, chat widget, SMTP) are scheduled for a future step.
        </p>
      </Section>

    </form>
  );
}
