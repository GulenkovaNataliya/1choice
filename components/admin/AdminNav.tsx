"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/admin/dashboard" },
  { label: "Properties", href: "/admin/properties" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Chat Alerts", href: "/admin/chat-alerts" },
  { label: "Areas", href: "/admin/areas" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-2 md:order-2 md:w-auto md:gap-6">
      {NAV_ITEMS.map(({ label, href }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm transition-colors ${
              active
                ? "text-[#1E1E1E] font-semibold"
                : "text-[#555555] hover:text-[#1E1E1E]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
