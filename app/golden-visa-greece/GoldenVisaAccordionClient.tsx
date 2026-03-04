"use client";

import { useState } from "react";

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

type Item = { title: string; blocks: Block[] };

const ITEMS: Item[] = [
  {
    title: "What is the Greek Golden Visa",
    blocks: [
      { type: "p", text: "The Greek Golden Visa is a government-regulated residency-by-investment program granting non-EU nationals a renewable five-year residence permit through a qualifying investment in Greece." },
      { type: "p", text: "Depending on the location and property category, the current real estate investment thresholds start from €250,000 and may be higher in designated high-demand zones under the applicable legal framework." },
      { type: "p", text: "Golden Visa holders benefit from:" },
      { type: "ul", items: [
        "Residence rights in Greece",
        "Visa-free travel across the Schengen Area (90/180 rule)",
        "Access to education and healthcare",
        "Inclusion of eligible family members under the same investment",
      ]},
      { type: "p", text: "At 1Choice IKE, we do not simply present properties. We structure the investment from the beginning to ensure that the selected asset satisfies both legal residency criteria and long-term investment logic." },
      { type: "p", text: "From property selection to final permit issuance, our team coordinates every stage of the process so the investor is never navigating the system alone." },
    ],
  },
  {
    title: "Investment Requirements",
    blocks: [
      { type: "p", text: "The Golden Visa requires a qualifying investment aligned with the current legislative framework. Real estate remains the most common route, subject to regional thresholds and asset classifications." },
      { type: "p", text: "Because regulations and zoning thresholds can vary, selecting the right property is critical. Not all properties qualify under the same terms." },
      { type: "p", text: "First Choice Deals M. IKE evaluates:" },
      { type: "ul", items: [
        "Investment eligibility under current law",
        "Asset quality and market position",
        "Liquidity and exit potential",
        "Compliance documentation before contract signing",
      ]},
      { type: "p", text: "We work alongside legal professionals and, when required, financial institutions to ensure the transaction is executed in full regulatory compliance." },
      { type: "p", text: "The objective is not only residency approval — but capital protection and structured asset positioning." },
    ],
  },
  {
    title: "Process Overview",
    blocks: [
      { type: "p", text: "The Golden Visa process is structured and coordinated." },
      { type: "p", text: "At 1Choice IKE, we manage the sequence:" },
      { type: "ul", items: [
        "Initial strategy consultation and eligibility assessment",
        "Identification of compliant investment opportunities",
        "Coordination of legal due diligence",
        "Reservation and contract execution",
        "Coordination with banking institutions for transaction execution",
        "Preparation and submission of residency application",
        "Monitoring until permit issuance",
      ]},
      { type: "p", text: "We act as the central coordination point between:" },
      { type: "ul", items: [
        "the investor",
        "legal advisors",
        "notaries",
        "banks",
        "public authorities",
      ]},
      { type: "p", text: "The client receives structured guidance at every step, reducing procedural risk and avoiding fragmented communication." },
    ],
  },
  {
    title: "Timeline",
    blocks: [
      { type: "p", text: "Processing timelines depend on:" },
      { type: "ul", items: [
        "property type and location",
        "documentation readiness",
        "administrative processing volumes",
      ]},
      { type: "p", text: "While property acquisition may be completed efficiently, residency issuance follows official procedural timelines." },
      { type: "p", text: "First Choice Deals M. IKE creates a structured timeline from day one, aligning:" },
      { type: "ul", items: [
        "transaction milestones",
        "banking procedures",
        "documentation preparation",
        "application submission",
      ]},
      { type: "p", text: "This proactive coordination significantly reduces uncertainty and avoids delays caused by incomplete preparation." },
    ],
  },
  {
    title: "Family Inclusion",
    blocks: [
      { type: "p", text: "The Golden Visa framework allows inclusion of eligible family members within the same investment structure, subject to regulatory criteria." },
      { type: "p", text: "Typically, this may include:" },
      { type: "ul", items: [
        "spouse",
        "dependent children",
        "in certain cases, parents",
      ]},
      { type: "p", text: "Each family profile requires proper documentation and structured submission." },
      { type: "p", text: "First Choice Deals M. IKE oversees family application coordination, ensuring that all documentation is aligned with legal standards before submission, preventing avoidable rejections or delays." },
      { type: "p", text: "The result is a consolidated, professionally managed family residency pathway." },
    ],
  },
  {
    title: "Renewal Conditions",
    blocks: [
      { type: "p", text: "The residence permit is renewable provided the qualifying investment remains compliant with the legal framework." },
      { type: "p", text: "There is no continuous minimum stay requirement; however, the asset must remain active and properly maintained under program rules." },
      { type: "p", text: "First Choice Deals M. IKE monitors renewal timelines, assists with documentation updates, and coordinates procedural steps in advance of expiration to ensure uninterrupted residency status." },
      { type: "p", text: "Our involvement does not end at issuance. We maintain long-term advisory support aligned with the investor's broader property and residency strategy." },
    ],
  },
];

function renderBlocks(blocks: Block[]) {
  return blocks.map((block, i) => {
    if (block.type === "p") {
      return (
        <p key={i} className="text-sm text-[#404040] mb-3 leading-relaxed last:mb-0">
          {block.text}
        </p>
      );
    }
    return (
      <ul key={i} className="list-disc list-inside mb-3 space-y-1 last:mb-0">
        {block.items.map((item, j) => (
          <li key={j} className="text-sm text-[#404040]">{item}</li>
        ))}
      </ul>
    );
  });
}

export default function GoldenVisaAccordionClient() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="lg:sticky lg:top-24 flex flex-col gap-2">
      {ITEMS.map((item, i) => (
        <div key={i} className="border border-[#D9D9D9] rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#1E1E1E] hover:bg-[#F4F4F4] transition"
          >
            <span>{item.title}</span>
            <span className="ml-4 text-[#3A2E4F] text-xl leading-none flex-shrink-0 select-none">
              {open === i ? "−" : "+"}
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              open === i ? "max-h-[2000px]" : "max-h-0"
            }`}
          >
            <div className="px-5 pb-5 pt-2">
              {renderBlocks(item.blocks)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
