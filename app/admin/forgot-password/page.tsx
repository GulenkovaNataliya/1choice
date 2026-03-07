"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // redirectTo uses the current origin so it works in every environment
    // (localhost in dev, production domain in prod) without extra env vars.
    const { error: authError } = await getSupabase().auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/admin/reset-password` }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-[#1E1E1E] mb-3">Check your email</h1>
          <p className="text-sm text-[#555555]">
            If <span className="font-medium text-[#1E1E1E]">{email}</span> is registered,
            a password reset link has been sent.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block text-xs text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8">
        <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">Reset password</h1>
        <p className="text-sm text-[#555555] mb-6">
          Enter your admin email and we&apos;ll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#555555] uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] outline-none focus:border-[#1E1E1E] transition-colors"
            />
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
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
