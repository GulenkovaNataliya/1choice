import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | 1Choice",
  description: "Get in touch with 1Choice. We guide you through every step of your property investment in Greece.",
  alternates: { canonical: "/contact" },
};

// ── Contact details — replace with real values when ready ──
const EMAIL    = "contact@1choice.gr";
const PHONE    = "+30 000 000 0000";
const LOCATION = "Athens, Greece";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Hero */}
      <section className="bg-[#3A2E4F] px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact
          </h1>
          <p className="text-[#D9D9D9] text-lg leading-relaxed">
            Tell us what you are looking for and we will guide you through the next steps.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">

        {/* Contact Details */}
        <div>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-6">Contact Details</h2>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Email</span>
              <a href={`mailto:${EMAIL}`} className="text-[#404040] hover:text-[#3A2E4F] transition">
                {EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Phone</span>
              <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="text-[#404040] hover:text-[#3A2E4F] transition">
                {PHONE}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Location</span>
              <span className="text-[#404040]">{LOCATION}</span>
            </li>
          </ul>
        </div>

        {/* Business Hours */}
        <div>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-6">Business Hours</h2>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Mon–Fri</span>
              <span className="text-[#404040]">09:00–18:00</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Saturday</span>
              <span className="text-[#404040]">By appointment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#3A2E4F] font-medium w-24 flex-shrink-0">Sunday</span>
              <span className="text-[#404040]">Closed</span>
            </li>
          </ul>
        </div>

        {/* Consultation CTA */}
        <div className="bg-white rounded-2xl border border-[#D9D9D9] px-8 py-10 text-center">
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">
            Prefer a faster answer?
          </h2>
          {/* TODO: wire to consultation/chat handler when available */}
          <button
            type="button"
            disabled
            className="bg-[#3A2E4F] text-[#D9D9D9] px-8 py-4 rounded-xl font-medium opacity-50 cursor-default pointer-events-none"
          >
            Start a Consultation
          </button>
        </div>

      </section>
    </main>
  );
}
