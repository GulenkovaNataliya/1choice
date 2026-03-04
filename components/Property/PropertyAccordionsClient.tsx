"use client";

import { useState } from "react";

const SECTIONS = [
  {
    title: "Layout & Rooms",
    content: "Detailed room layout and floor plan information will be provided upon request.",
  },
  {
    title: "Construction Details",
    content: "Construction year, materials, building specifications, and energy certificate available on request.",
  },
  {
    title: "Comfort & Amenities",
    content: "Full list of amenities, appliances, and comfort features available upon enquiry.",
  },
  {
    title: "Legal & Investment Notes",
    content: "Title deed status, energy performance certificate, tax obligations, and investment details available on request.",
  },
];

export default function PropertyAccordionsClient() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {SECTIONS.map((section, i) => (
        <div key={i} className="border border-[#E8E8E8] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#1E1E1E] hover:bg-[#F4F4F4] transition bg-white"
          >
            <span>{section.title}</span>
            <span className="ml-4 text-[#3A2E4F] text-xl leading-none flex-shrink-0 select-none">
              {open === i ? "−" : "+"}
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              open === i ? "max-h-[500px]" : "max-h-0"
            }`}
          >
            <div className="px-5 pb-5 pt-2 text-sm text-[#404040] bg-white leading-relaxed">
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
