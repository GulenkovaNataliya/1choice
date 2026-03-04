import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About 1Choice | Real Estate in Greece",
  description:
    "1Choice is a boutique real estate and investment advisory firm focused on curated property opportunities in Greece.",
  alternates: { canonical: "/about" },
};

const TEAM = [
  { name: "Kostas Chousos",          role: "Civil Engineer" },
  { name: "Dimitris Nikolaidis",     role: "Architect" },
  { name: "Antonis Konstantinidis",  role: "Sales Manager" },
  { name: "Giorgos Dentias",         role: "Project Coordinator" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Hero / Intro */}
      <section className="bg-[#3A2E4F] px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About 1Choice
          </h1>
          <p className="text-[#D9D9D9] text-lg leading-relaxed">
            1Choice is a boutique real estate and investment advisory firm
            specialising in curated property opportunities across Greece.
            We select properties so you don&apos;t have to — combining market
            knowledge, legal clarity, and long-term investment logic to guide
            every client from first enquiry to completed acquisition.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1E1E1E] text-center mb-12">
          Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {TEAM.map(({ name, role }) => (
            <div key={name} className="flex flex-col items-center text-center gap-4">
              {/* Placeholder circular image */}
              <div className="w-40 h-40 rounded-full object-cover shadow-md border border-gray-200 bg-[#D9D9D9] flex items-center justify-center flex-shrink-0">
                <span className="text-[#888888] text-4xl font-light select-none">
                  {name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-[#1E1E1E] font-semibold text-base">{name}</p>
                <p className="text-[#404040] text-sm mt-1">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
