"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase sends a recovery link with either:
    //   - a ?code= query param (PKCE flow, the default with @supabase/ssr)
    //   - a #access_token=...&type=recovery hash (implicit flow, legacy)
    // createBrowserClient handles both automatically and fires PASSWORD_RECOVERY
    // (or SIGNED_IN on PKCE exchange) via onAuthStateChange.
    const supabase = getSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check for an existing session (e.g. page refresh after exchange).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMismatch(false);
    setError(null);

    if (password !== confirm) {
      setMismatch(true);
      return;
    }

    setLoading(true);

    const { error: authError } = await getSupabase().auth.updateUser({
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    // Sign out so the user logs in fresh with the new password.
    await getSupabase().auth.signOut();
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-[#1E1E1E] mb-3">Password updated</h1>
          <p className="text-sm text-[#555555] mb-6">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.push("/admin/login")}
            className="bg-[#1E1E1E] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#333333] transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#555555]">Verifying reset link…</p>
          <p className="text-xs text-[#999999] mt-2">
            If nothing happens,{" "}
            <Link
              href="/admin/forgot-password"
              className="underline hover:text-[#1E1E1E] transition-colors"
            >
              request a new link
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8">
        <h1 className="text-xl font-bold text-[#1E1E1E] mb-6">Set new password</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#555555] uppercase tracking-wide">
              New password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] outline-none focus:border-[#1E1E1E] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#555555] uppercase tracking-wide">
              Confirm password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm text-[#1E1E1E] outline-none focus:border-[#1E1E1E] transition-colors ${
                mismatch ? "border-red-400" : "border-[#E0E0E0]"
              }`}
            />
            {mismatch && (
              <p className="text-xs text-red-600 mt-0.5">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#1E1E1E] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
