export const metadata = {
  title: "Areas | Admin",
};

export default function AdminAreasPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Areas</h1>
        <p className="text-sm text-[#888888] mt-2">
          Manage location taxonomy used for properties (city, area, neighborhood).
        </p>
      </div>

      <div className="bg-white border border-[#E8E8E8] rounded-lg px-6 py-16 flex items-center justify-center">
        <p className="text-sm text-[#AAAAAA]">No areas configured yet.</p>
      </div>
    </div>
  );
}
