"use client";

import { useState } from "react";

type Item = { question: string; answer: string };

export default function AccordionClient({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="border border-[#D9D9D9] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#1E1E1E] bg-white hover:bg-[#F4F4F4] transition"
          >
            <span>{item.question}</span>
            <span className="ml-4 text-[#3A2E4F] text-lg leading-none flex-shrink-0">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 pt-1 text-sm text-[#404040] bg-white whitespace-pre-line">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
