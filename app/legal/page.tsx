import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal | 1Choice",
  description: "Legal information, terms of use, privacy policy and cookie notice for 1Choice.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Hero */}
      <section className="bg-[#3A2E4F] px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Legal</h1>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-12">

        {/* Company Information */}
        <section>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Company Information</h2>
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 flex flex-col gap-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="text-[#888888] sm:w-48 flex-shrink-0">Company Name</span>
              <span className="text-[#1E1E1E] font-medium">FIRST CHOICE DEALS ΜΟΝΟΠΡΟΣΩΠΗ ΙΚΕ</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="text-[#888888] sm:w-48 flex-shrink-0">GEMI Number</span>
              <span className="text-[#1E1E1E] font-medium">185859201000</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="text-[#888888] sm:w-48 flex-shrink-0">VAT Number (ΑΦΜ)</span>
              <span className="text-[#1E1E1E] font-medium">802942814</span>
            </div>
          </div>
        </section>

        {/* Terms of Use */}
        <section>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Terms of Use</h2>
          <div className="flex flex-col gap-3 text-sm text-[#404040] leading-relaxed">
            <p>
              The content published on this website is provided for informational purposes only.
              All property listings, prices, and availability are subject to change without notice
              and should not be relied upon as confirmed offers.
            </p>
            <p>
              1Choice makes no representation or warranty — express or implied — regarding the
              accuracy, completeness, or suitability of any information presented on this site.
            </p>
            <p>
              To the fullest extent permitted by applicable law, 1Choice shall not be liable for
              any direct, indirect, or consequential loss arising from the use of, or reliance on,
              any content found on this website.
            </p>
            <p>
              Use of this website constitutes acceptance of these terms. We reserve the right to
              update them at any time without prior notice.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Privacy Policy</h2>
          <div className="flex flex-col gap-3 text-sm text-[#404040] leading-relaxed">
            <p>
              When you interact with 1Choice — through contact forms, chat messages, or enquiry
              submissions — we may collect personal information such as your name, email address,
              and the content of your message.
            </p>
            <p>
              We also collect anonymised usage data through analytics tools to understand how
              visitors use the site and improve our service. This data does not identify you personally.
            </p>
            <p>
              We use the information we collect solely to respond to your enquiries and to improve
              the quality of our service. We do not sell, rent, or share your personal data with
              third parties for marketing purposes.
            </p>
            <p>
              You have the right to request access to, correction of, or deletion of any personal
              data we hold about you. To exercise these rights, please contact us at{" "}
              <a
                href="mailto:contact@1choice.gr"
                className="text-[#3A2E4F] hover:opacity-70 transition underline underline-offset-2"
              >
                contact@1choice.gr
              </a>.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">Cookies</h2>
          <div className="flex flex-col gap-3 text-sm text-[#404040] leading-relaxed">
            <p>
              This website may use cookies to ensure basic functionality and to collect anonymised
              analytics data. Cookies fall into two categories:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-1">
              <li>
                <span className="font-medium text-[#1E1E1E]">Essential cookies</span> — required
                for the site to function correctly.
              </li>
              <li>
                <span className="font-medium text-[#1E1E1E]">Analytics cookies</span> — used to
                understand how visitors interact with the site. No personally identifiable
                information is stored.
              </li>
            </ul>
            <p>
              A cookie consent banner may be added to this site in a future update to allow you to
              manage your preferences.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-[#888888] border-t border-[#E8E8E8] pt-8 leading-relaxed">
          This page is provided for general information only and does not constitute legal advice.
        </p>

      </div>
    </main>
  );
}
