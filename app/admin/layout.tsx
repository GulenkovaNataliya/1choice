import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/admin/LogoutButton";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <header className="bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:gap-8">
          <span className="text-sm font-bold text-[#1E1E1E] uppercase tracking-widest">Admin</span>
          <div className="ml-auto md:order-3">
            <LogoutButton />
          </div>
          <AdminNav />
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
