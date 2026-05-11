"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export type ChatAlert = {
  id: string;
  created_at: string;
  status: string;
  intent: string | null;
  reason: string;
  message_excerpt: string | null;
  page_url: string | null;
  property_title: string | null;
  property_code: string | null;
  property_location: string | null;
  contact_found: boolean;
  source: string | null;
  language: string | null;
};

const STATUS_OPTIONS = [
  { value: "new",      label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "ignored",  label: "Ignored" },
];

const INTENT_LABELS: Record<string, string> = {
  property_search:     "Property Search",
  investment_strategy: "Investment Strategy",
  golden_visa:         "Golden Visa",
  viewing_request:     "Viewing Request",
  contact_advisor:     "Contact Advisor",
  property_viewing:    "Property Viewing",
  property_inquiry:    "Property Inquiry",
  general_question:    "General Question",
};

const REASON_LABELS: Record<string, string> = {
  trigger_lead_form:    "AI suggested a lead form",
  viewing_signal:       "Viewing or visit request",
  contact_signal:       "Consultation or contact request",
  phone_in_message:     "Phone number in chat message",
  email_in_message:     "Email address in chat message",
  high_intent_keywords: "High-intent buying keywords",
  intent_action:        "High-intent quick action",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,"0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function labelIntent(intent: string | null): string {
  if (!intent) return "Unknown";
  return INTENT_LABELS[intent] ?? intent;
}

function labelReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "new"
      ? "bg-blue-100 text-blue-700"
      : status === "reviewed"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-[#F0F0F0] text-[#888888]";
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

function AlertDetailModal({
  alert,
  onClose,
  onStatusChange,
  onDelete,
  busy,
  error,
}: {
  alert: ChatAlert;
  onClose: () => void;
  onStatusChange: (alertId: string, status: string) => void;
  onDelete: (alert: ChatAlert) => void;
  busy: boolean;
  error: string | null;
}) {
  const propertyLabel = alert.property_title || alert.property_code
    ? `${alert.property_title ?? "Property"}${alert.property_code ? ` (${alert.property_code})` : ""}`
    : "General";

  const rows: [string, React.ReactNode][] = [
    ["Created", fmtDate(alert.created_at)],
    ["Status", <StatusBadge key="status" status={alert.status} />],
    ["Intent", labelIntent(alert.intent)],
    ["Signal", labelReason(alert.reason)],
    ["Property", propertyLabel],
    ...(alert.property_location
      ? [["Location", alert.property_location] as [string, React.ReactNode]]
      : []),
    ["Contact found", alert.contact_found ? "Yes" : "No"],
    ["Source", alert.source ?? "Unknown"],
    ...(alert.language
      ? [["Language", alert.language] as [string, React.ReactNode]]
      : []),
    ["Page", alert.page_url
      ? (
          <a
            key="page"
            href={alert.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs break-all text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {alert.page_url}
          </a>
        )
      : "-"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest">
            Chat Alert Detail
          </h2>
          <button
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#1E1E1E] transition-colors text-lg leading-none"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#F4F4F4]">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="py-2 pr-4 text-[#888888] whitespace-nowrap w-28 align-top">{label}</td>
                  <td className="py-2 text-[#1E1E1E] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {alert.message_excerpt && (
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-widest mb-1.5">Message Excerpt</p>
              <p className="text-sm text-[#1E1E1E] whitespace-pre-wrap bg-[#F9F9F9] rounded-lg px-4 py-3">
                {alert.message_excerpt}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8]">
          <button
            type="button"
            onClick={() => onStatusChange(alert.id, "reviewed")}
            disabled={busy || alert.status === "reviewed"}
            className="px-4 py-2 text-sm text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-default"
          >
            Mark reviewed
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(alert.id, "ignored")}
            disabled={busy || alert.status === "ignored"}
            className="px-4 py-2 text-sm text-[#555555] border border-[#D9D9D9] rounded-lg hover:bg-[#F4F4F4] transition disabled:opacity-40 disabled:cursor-default"
          >
            Ignore
          </button>
          <button
            type="button"
            onClick={() => onDelete(alert)}
            disabled={busy}
            className="px-4 py-2 text-sm text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-default"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatAlertsManager({
  initialRows,
  selectedId = null,
}: {
  initialRows: ChatAlert[];
  selectedId?: string | null;
}) {
  const router = useRouter();
  const [detailAlert, setDetailAlert] = useState<ChatAlert | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const alert = initialRows.find((row) => row.id === selectedId);
    if (alert) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailAlert(alert);
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

  async function handleStatusChange(alertId: string, status: string) {
    setBusyId(alertId);
    setError(null);
    const { error: updateError } = await getSupabase()
      .from("chat_alerts")
      .update({ status })
      .eq("id", alertId);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDetailAlert((current) => current && current.id === alertId ? { ...current, status } : current);
    refresh();
  }

  async function handleDelete(alert: ChatAlert) {
    const confirmation = window.prompt(
      "Type DELETE to permanently delete this chat alert."
    );
    if (confirmation !== "DELETE") return;

    setBusyId(alert.id);
    setError(null);
    const { error: deleteError } = await getSupabase()
      .from("chat_alerts")
      .delete()
      .eq("id", alert.id);
    setBusyId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setDetailAlert(null);
    if (selectedId === alert.id) {
      router.replace("/admin/chat-alerts");
    }
    refresh();
  }

  const filteredRows =
    statusFilter === "all"
      ? initialRows
      : initialRows.filter((alert) => alert.status === statusFilter);

  return (
    <>
      {detailAlert && (
        <AlertDetailModal
          alert={detailAlert}
          onClose={() => setDetailAlert(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          busy={busyId === detailAlert.id}
          error={error}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map((opt) => {
          const count =
            opt.value === "all"
              ? initialRows.length
              : initialRows.filter((alert) => alert.status === opt.value).length;
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
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F4F4] border-b border-[#E0E0E0]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Signal</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#AAAAAA]">
                    No chat alerts match this filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((alert) => {
                  const isBusy = busyId === alert.id;
                  const isHighlighted = alert.id === selectedId;
                  const propertyLabel = alert.property_code ?? alert.property_title ?? "General";
                  return (
                    <tr
                      key={alert.id}
                      ref={isHighlighted ? highlightedRowRef : null}
                      onClick={() => setDetailAlert(alert)}
                      className={`cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-amber-50 ring-2 ring-inset ring-amber-300"
                          : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
                        {fmtDate(alert.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1E1E1E]">{labelIntent(alert.intent)}</div>
                        <div className="text-xs text-[#888888] mt-0.5">{labelReason(alert.reason)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#555555]">
                        <div>{propertyLabel}</div>
                        {alert.property_location && (
                          <div className="text-[#888888] mt-0.5">{alert.property_location}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {alert.contact_found ? (
                          <span className="text-emerald-700">Yes</span>
                        ) : (
                          <span className="text-[#888888]">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#555555] max-w-xs">
                        <div className="truncate" title={alert.message_excerpt ?? ""}>
                          {alert.message_excerpt ?? "-"}
                        </div>
                        {alert.page_url && (
                          <a
                            href={alert.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3A2E4F] underline underline-offset-2 hover:opacity-70 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Page
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(alert.id, "reviewed")}
                            disabled={isBusy || alert.status === "reviewed"}
                            className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:opacity-70 transition disabled:opacity-40 disabled:cursor-default"
                          >
                            Reviewed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(alert.id, "ignored")}
                            disabled={isBusy || alert.status === "ignored"}
                            className="text-xs font-medium text-[#555555] underline underline-offset-2 hover:opacity-70 transition disabled:opacity-40 disabled:cursor-default"
                          >
                            Ignore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(alert)}
                            disabled={isBusy}
                            className="text-xs font-medium text-red-700 underline underline-offset-2 hover:opacity-70 transition disabled:opacity-40 disabled:cursor-default"
                          >
                            Delete
                          </button>
                        </div>
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
