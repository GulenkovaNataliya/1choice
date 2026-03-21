"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Lead = {
  id: string;
  created_at: string;
  lead_type: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  page_url: string | null;
  property_id: string | null;
  property_code: string | null;
  property_title: string | null;
  property_slug: string | null;
  property_location: string | null;
  entry_intent: string | null;
  intent: string | null;
  notes: string | null;
  summary: string | null;
  full_chat: string | null;
  status: string;
  internal_note: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  home:               "Home",
  properties:         "Properties",
  property:           "Property",
  "golden-visa":      "Golden Visa",
  "investment-guide": "Investment Guide",
  private:            "Private",
  deals:              "Deals",
  saved:              "Saved",
  compare:            "Compare",
  // backward compat: old leads submitted with source="chat" before STEP 137
  chat:               "Chat",
};

const STATUS_OPTIONS = [
  { value: "new",                label: "New" },
  { value: "in_progress",        label: "In Progress" },
  { value: "viewing_scheduled",  label: "Viewing Scheduled" },
  { value: "closed",             label: "Closed" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  return SOURCE_LABELS[source] ?? source;
}

/** Parse "Intent: <value>" line from summary text, if present. */
function parseIntentFromSummary(summary: string | null): string | null {
  if (!summary) return null;
  const line = summary.split("\n").find((l) => l.startsWith("Intent:"));
  if (!line) return null;
  return line.replace(/^Intent:\s*/, "").trim() || null;
}

// ── Freshness ─────────────────────────────────────────────────────────────────

function isNewLead(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  return now - created < DAY;
}

// ── Urgency ───────────────────────────────────────────────────────────────────

function urgencyRank(intent: string | null): number {
  if (intent === "viewing_request") return 3;
  if (intent === "contact_advisor") return 2;
  return 1;
}

function getLeadUrgency(intent: string | null): "high" | "medium" | "low" {
  if (intent === "viewing_request") return "high";
  if (intent === "contact_advisor") return "medium";
  return "low";
}

function UrgencyBadge({ intent }: { intent: string | null }) {
  const urgency = getLeadUrgency(intent);
  const cls =
    urgency === "high"
      ? "bg-red-100 text-red-700"
      : urgency === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-600";
  const label = urgency === "high" ? "HIGH" : urgency === "medium" ? "MEDIUM" : "LOW";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "new"
      ? "bg-blue-100 text-blue-700"
      : status === "in_progress"
        ? "bg-amber-100 text-amber-700"
        : status === "viewing_scheduled"
          ? "bg-violet-100 text-violet-700"
          : "bg-[#F0F0F0] text-[#888888]";
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

// ── Chat log renderer ─────────────────────────────────────────────────────────
// Leads store full_chat as JSON [{role,text}]. Old leads may have raw strings.
// Tries to parse as structured conversation; falls back to <pre> for old data.

function ChatLogDisplay({ raw }: { raw: string }) {
  try {
    const msgs = JSON.parse(raw) as Array<{ role: string; text: string }>;
    if (
      Array.isArray(msgs) &&
      msgs.length > 0 &&
      msgs.every((m) => typeof m.role === "string" && typeof m.text === "string")
    ) {
      return (
        <div className="bg-[#F4F4F4] rounded-lg px-4 py-3 flex flex-col gap-2">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`px-2.5 py-1.5 rounded-xl leading-relaxed max-w-[85%] ${
                  m.role === "user"
                    ? "bg-[#1E1E1E] text-white"
                    : "bg-white text-[#1E1E1E] border border-[#E0E0E0]"
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>
      );
    }
  } catch {
    // fall through to raw display
  }
  return (
    <pre className="text-xs text-[#1E1E1E] whitespace-pre-wrap bg-[#F4F4F4] rounded-lg px-4 py-3 overflow-x-auto leading-relaxed">
      {raw}
    </pre>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function LeadDetailModal({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [noteText, setNoteText] = useState(lead.internal_note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);

  // Use direct column; fall back to summary parse for legacy rows that predate Step 221
  const intentValue = lead.intent ?? parseIntentFromSummary(lead.summary);

  async function saveNote() {
    setSavingNote(true);
    setNoteError(null);
    setNoteSaved(false);
    const { error } = await getSupabase()
      .from("leads")
      .update({ internal_note: noteText })
      .eq("id", lead.id);
    setSavingNote(false);
    if (error) {
      setNoteError(error.message);
    } else {
      setNoteSaved(true);
      onUpdated();
    }
  }

  // Property cell: title with links when available
  function PropertyCell() {
    if (!lead.property_title) return <span className="text-[#AAAAAA]">General</span>;
    const label = `${lead.property_title}${lead.property_code ? ` (${lead.property_code})` : ""}`;
    return (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        <span className="flex gap-3 text-xs">
          {lead.property_slug && (
            <Link
              href={`/properties/${lead.property_slug}`}
              target="_blank"
              className="text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              View listing ↗
            </Link>
          )}
          {lead.property_id && (
            <Link
              href={`/admin/properties/${lead.property_id}/edit`}
              target="_blank"
              className="text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Edit in admin ↗
            </Link>
          )}
        </span>
      </span>
    );
  }

  const rows: [string, React.ReactNode][] = [
    // ── Contact ──────────────────────────────────────────────────────────────
    ["Name",             lead.name],
    ["Email",            lead.email ?? "—"],
    ["WhatsApp / Phone", lead.phone ?? "—"],
    // ── Lead type ─────────────────────────────────────────────────────────────
    ["Type", (
      <span key="type" className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
        lead.lead_type === "property"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-[#F0F0F0] text-[#888888]"
      }`}>
        {lead.lead_type === "property" ? "Property" : "General"}
      </span>
    )],
    // ── Property ──────────────────────────────────────────────────────────────
    ["Property", <PropertyCell key="prop" />],
    ...(lead.property_location
      ? [["Location", lead.property_location] as [string, React.ReactNode]]
      : []),
    // ── Intent ────────────────────────────────────────────────────────────────
    ...(intentValue
      ? [["Intent", intentValue] as [string, React.ReactNode]]
      : []),
    ...(lead.entry_intent
      ? [["Entry Intent", lead.entry_intent] as [string, React.ReactNode]]
      : []),
    // ── Notes (user message) ──────────────────────────────────────────────────
    ...(lead.notes
      ? [["Notes", <span key="notes" className="whitespace-pre-wrap">{lead.notes}</span>] as [string, React.ReactNode]]
      : []),
    // ── Source / Page ─────────────────────────────────────────────────────────
    ["Source", sourceLabel(lead.source)],
    ["Page",   lead.page_url
      ? (
          <a
            key="page"
            href={lead.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs break-all text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {lead.page_url} ↗
          </a>
        )
      : "—"],
    // ── Status ────────────────────────────────────────────────────────────────
    ["Status", <StatusBadge key="status" status={lead.status} />],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest">
            Lead Detail
          </h2>
          <button
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#1E1E1E] transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* Info table */}
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#F4F4F4]">
              {rows.map(([label, value]) => (
                <tr key={label as string}>
                  <td className="py-2 pr-4 text-[#888888] whitespace-nowrap w-28 align-top">{label}</td>
                  <td className="py-2 text-[#1E1E1E] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          {lead.summary && (
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Summary</p>
              <p className="text-sm text-[#1E1E1E] whitespace-pre-wrap bg-[#F9F9F9] rounded-lg px-4 py-3">
                {lead.summary}
              </p>
            </div>
          )}

          {/* Chat log */}
          {lead.full_chat && (
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Chat Log</p>
              <ChatLogDisplay raw={lead.full_chat} />
            </div>
          )}

          {/* Internal note */}
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Internal Note</p>
            <textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false); }}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] transition resize-y min-h-20"
              placeholder="Add internal note…"
            />
            {noteError && (
              <p className="text-xs text-red-600 mt-1">{noteError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8]">
          {noteSaved && <span className="text-xs text-green-600">Note saved</span>}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Close
          </button>
          <button
            onClick={saveNote}
            disabled={savingNote}
            className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
          >
            {savingNote ? "Saving…" : "Save Note"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LeadsManager({
  initialRows,
  selectedId = null,
}: {
  initialRows: Lead[];
  selectedId?: string | null;
}) {
  const router = useRouter();
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<"urgency_desc" | "urgency_asc" | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Auto-open modal and scroll to highlighted row when selectedId is set
  useEffect(() => {
    if (!selectedId) return;
    const lead = initialRows.find((l) => l.id === selectedId);
    if (lead) {
      setDetailLead(lead);
    }
  }, [selectedId, initialRows]);

  useEffect(() => {
    if (selectedId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [selectedId]);

  function refresh() {
    router.refresh();
  }

  async function handleStatusChange(leadId: string, status: string) {
    setSavingStatusId(leadId);
    await getSupabase().from("leads").update({ status }).eq("id", leadId);
    setSavingStatusId(null);
    refresh();
  }

  const term = search.trim().toLowerCase();
  const searchedRows = term
    ? initialRows.filter((l) =>
        l.name.toLowerCase().includes(term) ||
        (l.phone ?? "").toLowerCase().includes(term) ||
        (l.email ?? "").toLowerCase().includes(term)
      )
    : initialRows;

  const dateFilteredRows = searchedRows.filter((l) => {
    const day = l.created_at.slice(0, 10); // "YYYY-MM-DD" (UTC)
    if (dateFrom && day < dateFrom) return false;
    if (dateTo   && day > dateTo)   return false;
    return true;
  });

  const filteredRows =
    statusFilter === "all"
      ? dateFilteredRows
      : dateFilteredRows.filter((l) => l.status === statusFilter);

  const sortedRows = sort
    ? [...filteredRows].sort((a, b) => {
        const diff = urgencyRank(b.intent) - urgencyRank(a.intent);
        return sort === "urgency_desc" ? diff : -diff;
      })
    : filteredRows;

  if (initialRows.length === 0) {
    return (
      <div className="bg-white border border-[#E8E8E8] rounded-lg px-6 py-16 flex items-center justify-center">
        <p className="text-sm text-[#AAAAAA]">No leads yet.</p>
      </div>
    );
  }

  return (
    <>
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onUpdated={refresh}
        />
      )}

      {/* Search + date range */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="flex-1 min-w-[200px] max-w-sm border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#888888] whitespace-nowrap">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-[#D9D9D9] rounded-lg px-2 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition"
          />
          <span className="text-xs text-[#888888]">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-[#D9D9D9] rounded-lg px-2 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition"
          />
        </div>
      </div>

      {/* Status filter + sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map((opt) => {
          const count =
            opt.value === "all"
              ? initialRows.length
              : initialRows.filter((l) => l.status === opt.value).length;
          const active = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? "bg-[#1E1E1E] text-white"
                  : "bg-white border border-[#D9D9D9] text-[#555555] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
              }`}
            >
              {opt.label}
              <span className={`ml-1.5 ${active ? "text-[#AAAAAA]" : "text-[#AAAAAA]"}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <span className="w-px h-5 bg-[#D9D9D9] mx-1 self-center" />

        {/* Urgency sort */}
        <button
          type="button"
          onClick={() =>
            setSort(
              sort === null ? "urgency_desc"
              : sort === "urgency_desc" ? "urgency_asc"
              : null
            )
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            sort
              ? "bg-[#1E1E1E] text-white"
              : "bg-white border border-[#D9D9D9] text-[#555555] hover:border-[#1E1E1E] hover:text-[#1E1E1E]"
          }`}
        >
          Urgency{sort === "urgency_desc" ? " ↓" : sort === "urgency_asc" ? " ↑" : ""}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F4F4] border-b border-[#E0E0E0]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Intent</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Urgency</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-[#AAAAAA]">
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                sortedRows.map((lead) => {
                  const isSavingStatus = savingStatusId === lead.id;
                  const isHighlighted = lead.id === selectedId;
                  return (
                    <tr
                      key={lead.id}
                      ref={isHighlighted ? highlightedRowRef : null}
                      className={`transition-colors ${
                        isHighlighted
                          ? "bg-amber-50 ring-2 ring-inset ring-amber-300"
                          : isNewLead(lead.created_at)
                            ? "bg-green-50 hover:bg-green-100/60"
                            : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#1E1E1E] font-medium">{lead.name}</span>
                          {isNewLead(lead.created_at) && (
                            <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-md font-semibold">
                              NEW
                            </span>
                          )}
                        </div>
                        {lead.notes && (
                          <div
                            className="text-xs text-[#888888] mt-0.5 max-w-45 truncate"
                            title={lead.notes}
                          >
                            {lead.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="text-xs text-[#888888]">{lead.phone}</div>}
                        {!lead.email && !lead.phone && "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          lead.lead_type === "property"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#F0F0F0] text-[#888888]"
                        }`}>
                          {lead.lead_type === "property" ? "Property" : "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">{sourceLabel(lead.source)}</td>
                      <td className="px-4 py-3 text-xs text-[#555555]">
                        {lead.entry_intent ?? <span className="text-[#AAAAAA]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <UrgencyBadge intent={lead.intent} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {lead.property_title ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#555555]">{lead.property_code ?? lead.property_title}</span>
                            {lead.property_slug && (
                              <Link
                                href={`/properties/${lead.property_slug}`}
                                target="_blank"
                                className="text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity whitespace-nowrap"
                              >
                                View ↗
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#AAAAAA]">General</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          disabled={isSavingStatus}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="text-xs border border-[#D9D9D9] rounded-md px-2 py-1 text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition disabled:opacity-40 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="text-xs font-medium text-[#1E1E1E] underline underline-offset-2 hover:text-[#555555] transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
