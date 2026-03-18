"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import DealsExportModal from "@/components/admin/DealsExportModal";
import { logActivity, type ActivityAction } from "@/lib/admin/logActivity";

export type AdminProperty = {
  id: string;
  property_code: string | null;
  title: string;
  slug: string;
  status: string | null;
  publish_1choice: boolean | null;
  publish_deals: boolean | null;
  private_collection: boolean | null;
  featured: boolean | null;
  is_golden_visa: boolean | null;
  created_at: string;
  updated_at: string | null;
  location: string | null;
  location_text: string | null;
  price_eur: number | null;
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

  // Optimistic state for all toggleable flags
  const [pub1choice, setPub1choice] = useState(property.publish_1choice ?? false);
  const [pubDeals, setPubDeals] = useState(property.publish_deals ?? false);
  const [privateCollection, setPrivateCollection] = useState(property.private_collection ?? false);
  const [featured, setFeatured] = useState(property.featured ?? false);
  const [goldenVisa, setGoldenVisa] = useState(property.is_golden_visa ?? false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  type FlagField = "publish_1choice" | "publish_deals" | "private_collection" | "featured" | "is_golden_visa";

  const flagActionMap: Record<FlagField, ActivityAction> = {
    publish_1choice: "property_toggle_publish_1choice",
    publish_deals:   "property_toggle_publish_deals",
    private_collection: "property_toggle_private_collection",
    featured:        "property_toggle_featured",
    is_golden_visa:  "property_toggle_golden_visa",
  };

  async function toggleFlag(field: FlagField) {
    const stateMap: Record<FlagField, [boolean, (v: boolean) => void]> = {
      publish_1choice: [pub1choice, setPub1choice],
      publish_deals: [pubDeals, setPubDeals],
      private_collection: [privateCollection, setPrivateCollection],
      featured: [featured, setFeatured],
      is_golden_visa: [goldenVisa, setGoldenVisa],
    };
    const [current, setter] = stateMap[field];
    const next = !current;

    setToggleError(null);
    setSavingField(field);
    setter(next); // optimistic

    const { error } = await getSupabase()
      .from("properties")
      .update({ [field]: next })
      .eq("id", property.id);

    if (error) {
      setter(current); // rollback on failure
      setToggleError("Save failed — try again");
    } else {
      logActivity(property.id, flagActionMap[field], {
        value: next,
        property_code: property.property_code,
      });
    }
    setSavingField(null);
  }

  async function archive() {
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "archived" }).eq("id", property.id);
    if (!error) logActivity(property.id, "property_archived", { previous_status: property.status, new_status: "archived", property_code: property.property_code });
    setBusy(false);
    onRefresh();
  }

  async function restore() {
    setBusy(true);
    const supabase = getSupabase();
    const { error } = await supabase.from("properties").update({ status: "draft" }).eq("id", property.id);
    if (!error) logActivity(property.id, "property_restored", { previous_status: "archived", new_status: "draft", property_code: property.property_code });
    setBusy(false);
    onRefresh();
  }

  async function remove() {
    const input = window.prompt("Type DELETE to permanently remove this property:");
    if (input !== "DELETE") return;
    setBusy(true);
    const supabase = getSupabase();
    await logActivity(property.id, "property_deleted", { title: property.title, property_code: property.property_code });
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
      publish_1choice: _p1, publish_deals: _pd, private_collection: _pc,
      featured: _feat, is_golden_visa: _gv, created_at: _ca, ...rest } = source;

    const { data: inserted } = await supabase
      .from("properties")
      .insert({ ...rest, property_code: newCode, slug: null, status: "draft",
        publish_1choice: false, publish_deals: false, private_collection: false,
        featured: false, is_golden_visa: false })
      .select("id").single();

    setBusy(false);

    if (inserted?.id) {
      logActivity(inserted.id, "property_duplicated", { source_property_id: property.id, source_property_code: property.property_code });
      router.push(`/admin/properties/${inserted.id}/edit`);
    }
  }

  const dateLabel = property.updated_at ?? property.created_at;

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
          disabled={savingField === "publish_1choice"}
          onChange={() => toggleFlag("publish_1choice")}
          label="Toggle Publish 1Choice"
        />
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={pubDeals}
          disabled={savingField === "publish_deals"}
          onChange={() => toggleFlag("publish_deals")}
          label="Toggle Publish Deals"
        />
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={privateCollection}
          disabled={savingField === "private_collection"}
          onChange={() => toggleFlag("private_collection")}
          label="Toggle Private Collection"
        />
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={featured}
          disabled={savingField === "featured"}
          onChange={() => toggleFlag("featured")}
          label="Toggle Featured"
        />
      </td>
      <td className="px-4 py-3">
        <Toggle
          on={goldenVisa}
          disabled={savingField === "is_golden_visa"}
          onChange={() => toggleFlag("is_golden_visa")}
          label="Toggle Golden Visa"
        />
      </td>
      <td className="px-4 py-3 text-[#888888] whitespace-nowrap text-xs">
        {new Date(dateLabel).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          {toggleError && (
            <span className="text-xs text-red-600">{toggleError}</span>
          )}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Link
              href={`/admin/properties/${property.id}/edit`}
              className="text-xs font-medium text-[#1E1E1E] underline underline-offset-2 hover:text-[#555555] transition-colors"
            >
              Edit
            </Link>
            {property.status === "published" && property.publish_deals ? (
              <ActionButton onClick={onExport} disabled={busy} className="text-blue-600 hover:text-blue-800">
                Deals Export
              </ActionButton>
            ) : (
              <span
                className="text-xs font-medium text-[#CCCCCC] cursor-default"
                title={
                  property.status !== "published"
                    ? "Status must be published"
                    : "Deals publishing not enabled"
                }
              >
                Deals Export
              </span>
            )}
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

// ── Filter controls ───────────────────────────────────────────────────────────

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortKey = "updated_desc" | "updated_asc" | "price_desc" | "price_asc";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "published", label: "Published" },
  { value: "draft",     label: "Draft"     },
  { value: "archived",  label: "Archived"  },
];

function FilterBar({
  search,
  onSearch,
  status,
  onStatus,
  flags,
  onFlag,
  sort,
  onSort,
  total,
  shown,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  flags: { featured: boolean; deals: boolean; private: boolean };
  onFlag: (k: keyof typeof flags) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  total: number;
  shown: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-3 flex flex-col gap-3">
      {/* Row 1: search + sort */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by code, title or location…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="flex-1 min-w-0 text-sm border border-[#E0E0E0] rounded px-3 py-1.5 focus:outline-none focus:border-[#1E1E1E] placeholder-[#AAAAAA]"
        />
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="text-sm border border-[#E0E0E0] rounded px-3 py-1.5 focus:outline-none focus:border-[#1E1E1E] bg-white text-[#1E1E1E] cursor-pointer"
        >
          <option value="updated_desc">Updated: newest first</option>
          <option value="updated_asc">Updated: oldest first</option>
          <option value="price_desc">Price: high to low</option>
          <option value="price_asc">Price: low to high</option>
        </select>
      </div>

      {/* Row 2: status tabs + flag pills + count */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center gap-1 mr-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onStatus(tab.value)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                status === tab.value
                  ? "bg-[#1E1E1E] text-white"
                  : "text-[#555555] hover:bg-[#F4F4F4]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[#D9D9D9] text-xs select-none">|</span>

        {/* Flag pills */}
        {(["featured", "deals", "private"] as const).map((key) => {
          const labels = { featured: "Featured", deals: "Deals", private: "Private" };
          return (
            <button
              key={key}
              onClick={() => onFlag(key)}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                flags[key]
                  ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                  : "text-[#555555] border-[#E0E0E0] hover:border-[#1E1E1E]"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}

        {/* Result count */}
        <span className="ml-auto text-xs text-[#AAAAAA]">
          {shown === total ? `${total} properties` : `${shown} of ${total}`}
        </span>
      </div>
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

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState<StatusFilter>("all");
  const [flags,      setFlags]      = useState({ featured: false, deals: false, private: false });
  const [sort,       setSort]       = useState<SortKey>("updated_desc");

  function toggleFlag(key: keyof typeof flags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Derived filtered + sorted rows ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) =>
        (p.property_code ?? "").toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q) ||
        (p.location_text ?? "").toLowerCase().includes(q)
      );
    }

    if (status !== "all") {
      result = result.filter((p) => p.status === status);
    }

    if (flags.featured) result = result.filter((p) => p.featured);
    if (flags.deals)    result = result.filter((p) => p.publish_deals);
    if (flags.private)  result = result.filter((p) => p.private_collection);

    const sorted = [...result];
    sorted.sort((a, b) => {
      switch (sort) {
        case "updated_desc":
          return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime();
        case "updated_asc":
          return new Date(a.updated_at ?? a.created_at).getTime() - new Date(b.updated_at ?? b.created_at).getTime();
        case "price_desc":
          return (b.price_eur ?? 0) - (a.price_eur ?? 0);
        case "price_asc":
          return (a.price_eur ?? 0) - (b.price_eur ?? 0);
      }
    });
    return sorted;
  }, [rows, search, status, flags, sort]);

  function refresh() {
    setSelected(new Set());
    router.refresh();
  }

  // ── Selection helpers (operate on filtered rows) ──────────────────────────

  const filteredIds = filtered.map((r) => r.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filteredIds));
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
        logActivity(id, "properties_bulk_archived", { previous_status: p?.status ?? null, new_status: "archived", count: ids.length, property_code: p?.property_code });
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
        const p = rows.find((r) => r.id === id);
        logActivity(id, "properties_bulk_restored", { previous_status: "archived", new_status: "draft", count: ids.length, property_code: p?.property_code });
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
        return logActivity(id, "properties_bulk_deleted", { title: p?.title ?? "", count: ids.length, property_code: p?.property_code });
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

      <FilterBar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        flags={flags}
        onFlag={toggleFlag}
        sort={sort}
        onSort={setSort}
        total={rows.length}
        shown={filtered.length}
      />

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
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Private</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Featured</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Golden Visa</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Updated</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COL_COUNT} className="px-4 py-12 text-center">
                    {rows.length === 0 ? (
                      <>
                        <p className="text-sm text-[#888888] mb-3">No properties yet.</p>
                        <Link
                          href="/admin/properties/new"
                          className="inline-block px-4 py-2 bg-[#1E1E1E] text-white text-xs font-semibold rounded hover:bg-[#333333] transition-colors"
                        >
                          Add first property
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-[#888888]">No properties match the current filters.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
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
