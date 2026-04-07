"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  url: string;
  title: string;
};

export default function PropertyShareBlock({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waUrl   = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this property: ${url}`)}`;

  return (
    <div className="border-t border-[#F0F0F0] pt-4 flex items-center gap-3 flex-wrap">
      <span className="text-sm text-[#AAAAAA]">Share</span>

      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-1.5 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
      >
        {copied
          ? <Check size={15} className="text-green-600" />
          : <Copy size={15} />}
        <span className={copied ? "text-green-600 font-medium" : ""}>
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>

      <span className="text-[#D9D9D9] select-none">·</span>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
        onClick={() => trackEvent("whatsapp_click")}
      >
        WhatsApp
      </a>

      <span className="text-[#D9D9D9] select-none">·</span>

      <a
        href={mailUrl}
        className="text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
      >
        Email
      </a>
    </div>
  );
}
