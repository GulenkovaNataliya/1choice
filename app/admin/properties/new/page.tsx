import CreatePropertyForm from "@/components/admin/CreatePropertyForm";

export const metadata = {
  title: "Create Property | Admin",
};

export default function NewPropertyPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs text-[#888888] uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-[#1E1E1E]">Create Property</h1>
        </div>
        <CreatePropertyForm />
      </div>
    </main>
  );
}
