"use client";

import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
    >
      Logout
    </button>
  );
}
