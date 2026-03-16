import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Private Collection | 1Choice",
  description:
    "Exclusive off-market properties from our Private Collection, available by private invitation only.",
};

export default function PrivatePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-20 md:py-32 text-center">
        <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest mb-4">
          Private Collection
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] leading-tight mb-6">
          Exclusive Properties,<br />By Invitation Only
        </h1>
        <p className="text-[#555555] text-base leading-relaxed max-w-xl mx-auto mb-4">
          Our most sought-after properties are shared privately through a
          personalised link. If you have received one, please use it directly
          to access the listing.
        </p>
        <p className="text-sm text-[#AAAAAA] mb-10">
          To enquire about private access, speak with your 1Choice advisor.
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition-colors"
        >
          Contact an Advisor
        </Link>
      </div>
    </main>
  );
}
