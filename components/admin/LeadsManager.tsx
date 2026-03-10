"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

type PropertyRef = { title: string; property_code: string | null } | null;

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  page_url: string | null;
  property_id: string | null;
  summary: string | null;
  chat_log: string | null;
  status: string;
  internal_note: string | null;
  properties: PropertyRef;
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
  // backward compat: old leads submitted with source="chat" before STEP 137
  chat:               "Chat",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  return SOURCE_LABELS[source] ?? source;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "new"
      ? "bg-blue-100 text-blue-700"
      : status === "in_progress"
        ? "bg-amber-100 text-amber-700"
        : "bg-[#F0F0F0] text-[#888888]";
  const label =
    status === "new" ? "New" : status === "in_progress" ? "In Progress" : "Closed";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

// ── Chat log renderer ─────────────────────────────────────────────────────────
// New leads store chat_log as JSON [{role,text}]. Old leads may have raw strings.
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

  const propertyLabel = lead.properties
    ? `${lead.properties.title}${lead.properties.property_code ? ` (${lead.properties.property_code})` : ""}`
    : null;

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

  const rows: [string, React.ReactNode][] = [
    ["Name",             lead.name],
    ["Email",            lead.email ?? "—"],
    ["WhatsApp / Phone", lead.phone ?? "—"],
    ["Source",           sourceLabel(lead.source)],
    ["Page",     lead.page_url
      ? <span className="font-mono text-xs break-all">{lead.page_url}</span>
      : "—"],
    ["Property", propertyLabel ?? "General"],
    ["Status",   <StatusBadge status={lead.status} />],
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
                <tr key={label}>
                  <td className="py-2 pr-4 text-[#888888] whitespace-nowrap w-24 align-top">{label}</td>
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
          {lead.chat_log && (
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Chat Log</p>
              <ChatLogDisplay raw={lead.chat_log} />
            </div>
          )}

          {/* Internal note */}
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Internal Note</p>
            <textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false); }}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] transition resize-y min-h-[80px]"
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

export default function LeadsManager({ initialRows }: { initialRows: Lead[] }) {
  const router = useRouter();
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleStatusChange(leadId: string, status: string) {
    setSavingStatusId(leadId);
    await getSupabase().from("leads").update({ status }).eq("id", leadId);
    setSavingStatusId(null);
    refresh();
  }

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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F4F4] border-b border-[#E0E0E0]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {initialRows.map((lead) => {
                const isSavingStatus = savingStatusId === lead.id;
                return (
                  <tr key={lead.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-[#1E1E1E] font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-[#555555]">
                      {lead.email && <div>{lead.email}</div>}
                      {lead.phone && <div className="text-xs text-[#888888]">{lead.phone}</div>}
                      {!lead.email && !lead.phone && "—"}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">{sourceLabel(lead.source)}</td>
                    <td className="px-4 py-3 text-xs">
                      {lead.properties
                        ? <span className="text-[#555555]">{lead.properties.property_code ?? lead.properties.title}</span>
                        : <span className="text-[#AAAAAA]">General</span>}
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
