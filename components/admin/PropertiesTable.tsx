"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import DealsExportModal from "@/components/admin/DealsExportModal";
import { logActivity } from "@/lib/admin/logActivity";

export type AdminProperty = {
  id: string;
  property_code: string | null;
  title: string;
  slug: string;
  status: string | null;
  publish_1choice: boolean | null;
  publish_deals: boolean | null;
  vip: boolean | null;
  featured: boolean | null;
  is_golden_visa: boolean | null;
  created_at: string;
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Badge({ active }: { active: boolean | null }) {
  if (!active) return <span className="text-[#AAAAAA]">—</span>;
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-[#1E1E1E] text-white rounded">
      Yes
    </span>
  );
}

function ActionButton({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-medium underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default ${className}`}
    >
      {children}
    </button>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  on,
  disabled,
  onChange,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-default
        ${on ? "bg-[#1E1E1E]" : "bg-[#D9D9D9]"}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
          ${on ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function PropertyRow({
  property,
  checked,
  onToggle,
  onRefresh,
  onExport,
}: {
  property: AdminProperty;
  checked: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isArchived = property.status === "archived";

  // Optimistic local state for publish toggles
  const [pub1choice, setPub1choice] = useState(property.publish_1choice ?? false);
  const [pubDeals, setPubDeals] = useState(property.publish_deals ?? false);

  async function togglePublish(field: "publish_1choice" | "publish_deals") {
    const next = field === "publish_1choice" ? !pub1choice : !pubDeals;
    // Optimistic update
    if (field === "publish_1choice") setPub1choice(next);
    else setPubDeals(next);

    const { error } = await getSupabase()
      .from("properties")
      .update({ [field]: next })
      .eq("id", property.id);

    if (error) {
      // Roll back on failure
      if (field === "publish_1choice") setPub1choice(!next);
      else setPubDeals(!next);
    } else {
      logActivity(property.id, "update", { field, value: next });
    }
  }

  async function archive() {
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "archived" }).eq("id", property.id);
    if (!error) logActivity(property.id, "archive", { previous_status: property.status, new_status: "archived" });
    setBusy(false);
    onRefresh();
  }

  async function restore() {
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "draft" }).eq("id", property.id);
    if (!error) logActivity(property.id, "restore", { previous_status: "archived", new_status: "draft" });
    setBusy(false);
    onRefresh();
  }

  async function remove() {
    const input = window.prompt("Type DELETE to permanently remove this property:");
    if (input !== "DELETE") return;
    setBusy(true);
    const supabase = getSupabase();
    await logActivity(property.id, "delete", { title: property.title });
    await supabase.from("properties").delete().eq("id", property.id);
    setBusy(false);
    onRefresh();
  }

  async function duplicate() {
    setBusy(true);
    const supabase = getSupabase();

    const { data: source } = await supabase.from("properties").select("*").eq("id", property.id).single();
    if (!source) { setBusy(false); return; }

    const { data: latest } = await supabase
      .from("properties").select("property_code").not("property_code", "is", null)
      .order("property_code", { ascending: false }).limit(1).single();

    let newCode = "code0001";
    if (latest?.property_code) {
      const match = String(latest.property_code).match(/(\d+)$/);
      const n = match ? parseInt(match[1], 10) : 0;
      newCode = "code" + String(n + 1).padStart(4, "0");
    }

    const { id: _id, property_code: _code, slug: _slug, status: _status,
      publish_1choice: _p1, publish_deals: _pd, vip: _vip,
      featured: _feat, is_golden_visa: _gv, created_at: _ca, ...rest } = source;

    const { data: inserted } = await supabase
      .from("properties")
      .insert({ ...rest, property_code: newCode, slug: null, status: "draft",
        publish_1choice: false, publish_deals: false, vip: false, featured: false, is_golden_visa: false })
      .select("id").single();

    setBusy(false);

    if (inserted?.id) {
      logActivity(inserted.id, "duplicate", { source_property_id: property.id });
      router.push(`/admin/properties/${inserted.id}/edit`);
    }
  }

  return (
    <tr className={`hover:bg-[#FAFAFA] transition-colors ${isArchived ? "opacity-60" : ""}`}>
      {/* Checkbox */}
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 rounded border-[#D9D9D9] accent-[#1E1E1E] cursor-pointer"
          aria-label={`Select ${property.title}`}
        />
      </td>
      <td className="px-4 py-3 text-[#1E1E1E] font-mono text-xs">{property.property_code ?? "—"}</td>
      <td className="px-4 py-3 text-[#1E1E1E] font-medium max-w-[220px] truncate">{property.title}</td>
      <td className="px-4 py-3">
        {property.status
          ? <span className="capitalize text-[#555555]">{property.status}</span>
          : <span className="text-[#AAAAAA]">—</span>}
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={pub1choice}
          onChange={() => togglePublish("publish_1choice")}
          label="Toggle Publish 1Choice"
        />
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={pubDeals}
          onChange={() => togglePublish("publish_deals")}
          label="Toggle Publish Deals"
        />
      </td>
      <td className="px-4 py-3"><Badge active={property.vip} /></td>
      <td className="px-4 py-3"><Badge active={property.featured} /></td>
      <td className="px-4 py-3"><Badge active={property.is_golden_visa} /></td>
      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
        {new Date(property.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="text-xs font-medium text-[#1E1E1E] underline underline-offset-2 hover:text-[#555555] transition-colors"
          >
            Edit
          </Link>
          <ActionButton onClick={onExport} disabled={busy} className="text-blue-600 hover:text-blue-800">
            Deals Export
          </ActionButton>
          <ActionButton onClick={duplicate} disabled={busy} className="text-[#555555] hover:text-[#1E1E1E]">
            Duplicate
          </ActionButton>
          {isArchived
            ? <ActionButton onClick={restore} disabled={busy} className="text-green-700 hover:text-green-900">Restore</ActionButton>
            : <ActionButton onClick={archive} disabled={busy} className="text-[#888888] hover:text-[#1E1E1E]">Archive</ActionButton>}
          <ActionButton onClick={remove} disabled={busy} className="text-red-600 hover:text-red-800">
            Delete
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}

// ── Bulk actions bar ──────────────────────────────────────────────────────────

function BulkBar({
  count,
  busy,
  onArchive,
  onRestore,
  onDelete,
  onClear,
}: {
  count: number;
  busy: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-4 bg-[#1E1E1E] text-white px-5 py-3 rounded-lg mb-3">
      <span className="text-sm font-medium">
        {count} selected
      </span>
      <div className="flex items-center gap-3 ml-2">
        <button
          onClick={onArchive}
          disabled={busy}
          className="text-xs font-medium text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-40"
        >
          Archive
        </button>
        <button
          onClick={onRestore}
          disabled={busy}
          className="text-xs font-medium text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-40"
        >
          Restore
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
        >
          Delete
        </button>
      </div>
      <button
        onClick={onClear}
        className="ml-auto text-xs text-[#666666] hover:text-white transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

const COL_COUNT = 11; // checkbox + 9 data cols + actions

export default function PropertiesTable({ rows }: { rows: AdminProperty[] }) {
  const router = useRouter();
  const [exportId, setExportId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  function refresh() {
    setSelected(new Set());
    router.refresh();
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  const allIds = rows.map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Bulk handlers ──────────────────────────────────────────────────────────

  async function bulkArchive() {
    setBulkBusy(true);
    const ids = [...selected];
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "archived" }).in("id", ids);
    if (!error) {
      ids.forEach((id) => {
        const p = rows.find((r) => r.id === id);
        logActivity(id, "archive", { previous_status: p?.status ?? null, new_status: "archived", bulk: true });
      });
    }
    setBulkBusy(false);
    refresh();
  }

  async function bulkRestore() {
    setBulkBusy(true);
    const ids = [...selected];
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "draft" }).in("id", ids);
    if (!error) {
      ids.forEach((id) => {
        logActivity(id, "restore", { previous_status: "archived", new_status: "draft", bulk: true });
      });
    }
    setBulkBusy(false);
    refresh();
  }

  async function bulkDelete() {
    const input = window.prompt(`Type DELETE to permanently remove ${selected.size} propert${selected.size === 1 ? "y" : "ies"}:`);
    if (input !== "DELETE") return;
    setBulkBusy(true);
    const ids = [...selected];
    const supabase = getSupabase();
    // Log all before deleting
    await Promise.all(
      ids.map((id) => {
        const p = rows.find((r) => r.id === id);
        return logActivity(id, "delete", { title: p?.title ?? "", bulk: true });
      })
    );
    await supabase.from("properties").delete().in("id", ids);
    setBulkBusy(false);
    refresh();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {exportId && (
        <DealsExportModal propertyId={exportId} onClose={() => setExportId(null)} />
      )}

      <BulkBar
        count={selected.size}
        busy={bulkBusy}
        onArchive={bulkArchive}
        onRestore={bulkRestore}
        onDelete={bulkDelete}
        onClear={() => setSelected(new Set())}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F4F4] border-b border-[#E0E0E0]">
              <tr>
                {/* Select-all checkbox */}
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-[#D9D9D9] accent-[#1E1E1E] cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">1Choice</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Deals</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">VIP</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Featured</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Golden Visa</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-[#888888]">
                    No properties found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <PropertyRow
                    key={p.id}
                    property={p}
                    checked={selected.has(p.id)}
                    onToggle={() => toggleOne(p.id)}
                    onRefresh={refresh}
                    onExport={() => setExportId(p.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
