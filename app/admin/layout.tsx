import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <header className="bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-8">
          <span className="text-sm font-bold text-[#1E1E1E] uppercase tracking-widest">Admin</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/properties"
              className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
            >
              Properties
            </Link>
            <Link
              href="/admin/leads"
              className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
            >
              Leads
            </Link>
            <Link
              href="/admin/areas"
              className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
            >
              Areas
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
