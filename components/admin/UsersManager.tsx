"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string | null;         // null = in ADMIN_EMAILS but no Supabase account yet
  email: string;
  created_at: string | null;
  status: "active" | "disabled" | "pending";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdminUser["status"] }) {
  const cls =
    status === "active"
      ? "bg-green-100 text-green-700"
      : status === "disabled"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
  const label =
    status === "active" ? "Active"
    : status === "disabled" ? "Disabled"
    : "Pending";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {label}
    </span>
  );
}

// ── Invite Modal ───────────────────────────────────────────────────────────────

function InviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const json = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to send invite");
      return;
    }

    onInvited();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest">Invite Admin</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#1E1E1E] transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1E1E1E]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] transition"
              placeholder="admin@example.com"
              autoFocus
            />
          </div>
          <p className="text-xs text-[#AAAAAA]">
            An invite email will be sent so they can set their password. Their email must
            also be present in the <span className="font-mono">ADMIN_EMAILS</span> environment
            variable to gain admin access.
          </p>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-50 disabled:cursor-default"
            >
              {busy ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function UsersManager({
  initialUsers,
  fetchError,
}: {
  initialUsers: AdminUser[];
  fetchError: string | null;
}) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setActionError(null);
    router.refresh();
  }

  async function callApi(id: string, method: "PATCH" | "DELETE", body?: object) {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Action failed");
      } else {
        refresh();
      }
    } catch {
      setActionError("Network error — please try again");
    }
    setBusyId(null);
  }

  async function handleDisable(user: AdminUser) {
    if (!user.id) return;
    await callApi(user.id, "PATCH", { action: "disable" });
  }

  async function handleEnable(user: AdminUser) {
    if (!user.id) return;
    await callApi(user.id, "PATCH", { action: "enable" });
  }

  async function handleDelete(user: AdminUser) {
    if (!user.id) return;
    const input = window.prompt(`Type DELETE to permanently remove ${user.email}:`);
    if (input !== "DELETE") return;
    await callApi(user.id, "DELETE");
  }

  return (
    <div>
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); refresh(); }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest">Users</h2>
        <button
          onClick={() => setShowInvite(true)}
          className="px-3 py-1.5 bg-[#1E1E1E] text-white text-xs font-semibold rounded hover:bg-[#333333] transition-colors"
        >
          Invite Admin
        </button>
      </div>

      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
          {actionError}
        </p>
      )}

      {fetchError ? (
        <div className="bg-[#FFF9F9] border border-red-200 rounded-lg px-6 py-6 text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">Could not load users</p>
          <p className="text-xs text-[#888888]">{fetchError}</p>
        </div>
      ) : initialUsers.length === 0 ? (
        <div className="border border-[#F0F0F0] rounded-lg px-6 py-8 flex items-center justify-center">
          <p className="text-sm text-[#AAAAAA]">No admin users found in ADMIN_EMAILS.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-[#F0F0F0]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F9F9F9] border-b border-[#F0F0F0]">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {initialUsers.map((user) => {
                  const isBusy = busyId === user.id;
                  return (
                    <tr key={user.email} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3 text-[#1E1E1E] font-medium">{user.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {!user.id && (
                            <span className="text-xs text-[#AAAAAA]">No account yet</span>
                          )}
                          {user.id && user.status === "active" && (
                            <button
                              onClick={() => handleDisable(user)}
                              disabled={isBusy}
                              className="text-xs font-medium text-[#888888] hover:text-[#1E1E1E] underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default"
                            >
                              {isBusy ? "…" : "Disable"}
                            </button>
                          )}
                          {user.id && user.status === "disabled" && (
                            <button
                              onClick={() => handleEnable(user)}
                              disabled={isBusy}
                              className="text-xs font-medium text-green-700 hover:text-green-900 underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default"
                            >
                              {isBusy ? "…" : "Enable"}
                            </button>
                          )}
                          {user.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={isBusy}
                              className="text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-default"
                            >
                              {isBusy ? "…" : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-[#AAAAAA] mt-3">
        Access is gated by the <span className="font-mono">ADMIN_EMAILS</span> environment variable.
        Only users whose email appears in that list can access the admin panel.
      </p>
    </div>
  );
}
