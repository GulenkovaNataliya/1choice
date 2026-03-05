export const metadata = {
  title: "Settings | Admin",
};

const SECTIONS = [
  {
    title: "Company Info",
    description: "Business name, registration number, address.",
  },
  {
    title: "Contact Details",
    description: "Phone, email, office hours.",
  },
  {
    title: "Branding / Assets",
    description: "Logo, favicon, brand colours.",
  },
  {
    title: "Integrations",
    description: "Chat widget, analytics, third-party services.",
  },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Settings</h1>
      </div>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white border border-[#E8E8E8] rounded-lg p-6"
          >
            <h2 className="text-sm font-semibold text-[#1E1E1E] mb-1">{section.title}</h2>
            <p className="text-xs text-[#AAAAAA] mb-4">{section.description}</p>
            <p className="text-sm text-[#BBBBBB]">To be configured.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
