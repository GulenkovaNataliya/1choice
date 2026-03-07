"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If a session already exists on mount, send the user to /admin.
  // (Middleware handles the same case server-side; this avoids a flash.)
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/admin");
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // signInWithPassword sets the session cookie via @supabase/ssr's
    // createBrowserClient. router.refresh() flushes server-component cache
    // so middleware sees the new cookie on the very next navigation.
    router.refresh();
    router.push("/admin");
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm bg-white border border-[#E0E0E0] rounded-2xl p-8">
        <h1 className="text-xl font-bold text-[#1E1E1E] mb-6">Admin sign in</h1>

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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#555555] uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/admin/forgot-password"
            className="text-xs text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
