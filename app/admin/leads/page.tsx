export const metadata = {
  title: "Leads | Admin",
};

export default function AdminLeadsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Leads / Requests</h1>
        <p className="text-sm text-[#888888] mt-2">
          This section will collect requests from the website chat and viewing requests.
        </p>
      </div>

      <div className="bg-white border border-[#E8E8E8] rounded-lg px-6 py-16 flex items-center justify-center">
        <p className="text-sm text-[#AAAAAA]">No leads yet.</p>
      </div>
    </div>
  );
}
