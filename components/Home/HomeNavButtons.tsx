import Link from "next/link";

type NavItem =
  | { label: string; href: string; disabled?: false }
  | { label: string; disabled: true };

const NAV_ITEMS: NavItem[] = [
  { label: "Properties", href: "/properties" },
  { label: "1ChoiceDeals", href: "/1choicedeals" },
  { label: "Golden Visa", href: "/golden-visa-greece" },
  { label: "Private Collection", disabled: true },
];

const BASE = "flex items-center justify-center rounded-xl px-6 py-5 text-center font-medium bg-[#3A2E4F] text-[#D9D9D9]";

export default function HomeNavButtons() {
  return (
    <section className="w-full px-4 md:px-8 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {NAV_ITEMS.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                className={`${BASE} opacity-50 pointer-events-none cursor-default`}
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`${BASE} hover:opacity-90 transition`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
