"use client";

import { useState } from "react";
import { logActivity } from "@/lib/admin/logActivity";

type Props = {
  propertyId: string;
  propertyCode: string | null;
  isPrivateCollection: boolean;
  initialToken: string | null;
};

export default function PrivateLinkManager({
  propertyId,
  propertyCode,
  isPrivateCollection,
  initialToken,
}: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullLink = token ? `${origin}/private/${token}` : null;

  async function callApi(method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/private-link`, { method });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Action failed");
      } else {
        setToken(method === "DELETE" ? null : (json.token ?? null));
      }
      return res.ok ? json : null;
    } catch {
      setError("Network error — please try again");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    const json = await callApi("POST");
    if (json?.token) {
      logActivity(propertyId, "private_link_generated", { property_code: propertyCode });
    }
  }

  async function handleRegenerate() {
    const json = await callApi("POST");
    if (json?.token) {
      logActivity(propertyId, "private_link_regenerated", { property_code: propertyCode });
    }
  }

  async function handleDelete() {
    const ok = await callApi("DELETE");
    if (ok) {
      logActivity(propertyId, "private_link_deleted", { property_code: propertyCode });
    }
  }

  async function handleCopy() {
    if (!fullLink) return;
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy — please copy the link manually");
    }
  }

  // ── Not Private Collection ──────────────────────────────────────────────────
  if (!isPrivateCollection) {
    return (
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
        <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
          Private Link
        </h2>
        <p className="text-sm text-[#AAAAAA]">
          Available only for Private Collection properties. Enable the Private Collection flag to generate a private link.
        </p>
      </div>
    );
  }

  // ── Private Collection: no token yet ──────────────────────────────────────
  if (!token) {
    return (
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
        <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-3">
          Private Link
        </h2>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
            {error}
          </p>
        )}
        <p className="text-sm text-[#555555] mb-4">
          No private link has been generated yet. Generate one to share with invited clients.
        </p>
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
        >
          {busy ? "Generating…" : "Generate Private Link"}
        </button>
      </div>
    );
  }

  // ── Private Collection: token exists ──────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
      <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-4">
        Private Link
      </h2>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}

      {/* Link display */}
      <div className="flex items-center gap-2 bg-[#F9F9F9] border border-[#E8E8E8] rounded-lg px-3 py-2.5 mb-4">
        <span className="text-xs font-mono text-[#1E1E1E] break-all flex-1 select-all">
          {fullLink}
        </span>
        <button
          onClick={handleCopy}
          disabled={busy}
          className="shrink-0 px-3 py-1 text-xs font-semibold rounded bg-[#1E1E1E] text-white hover:bg-[#333333] transition disabled:opacity-50 min-w-[60px]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRegenerate}
          disabled={busy}
          className="text-xs font-medium text-[#888888] hover:text-[#1E1E1E] underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          {busy ? "…" : "Regenerate"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          {busy ? "…" : "Delete Link"}
        </button>
      </div>

      <p className="text-xs text-[#AAAAAA] mt-3">
        Regenerate replaces the current link — the old URL will stop working immediately.
      </p>
    </div>
  );
}
