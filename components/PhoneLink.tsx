"use client";

import { trackEvent } from "@/lib/analytics";

export default function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="text-[#404040] hover:text-[#3A2E4F] transition"
      onClick={() => trackEvent("phone_click")}
    >
      {phone}
    </a>
  );
}
