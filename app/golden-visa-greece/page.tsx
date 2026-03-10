import type { Metadata } from "next";
import Link from "next/link";
import PropertyCard from "@/components/Property/PropertyCard";
import GoldenVisaAccordionClient from "./GoldenVisaAccordionClient";
import GoldenVisaCTAButton from "@/components/chat/GoldenVisaCTAButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Golden Visa Greece | 1Choice",
  description:
    "Residency by investment in Greece. Browse Golden Visa eligible properties curated by 1Choice.",
  alternates: { canonical: "/golden-visa-greece" },
};

const PAGE_SIZE = 9;

function titleCase(s: string) {
  return s
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function GoldenVisaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;

  // TODO: once `published` and `vip` columns exist in the `properties` table, set this to true:
  //   .eq("published", true)
  //   .eq("vip", false)
  const ENABLE_PUBLISHED_VIP_FILTERS = false;

  let query = supabase
    .from("properties")
    .select(
      "id,title,slug,price,location,bedrooms,bathrooms,size,cover_image_path,is_golden_visa,created_at",
      { count: "exact" }
    )
    .eq("is_golden_visa", true);

  if (ENABLE_PUBLISHED_VIP_FILTERS) {
    query = query.eq("published", true).eq("vip", false);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const properties = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    area: titleCase(p.location ?? ""),
    price_eur: p.price,
    is_golden_visa: true,
    is_1choice_deal: false,
    cover_image: p.cover_image_path
      ? `https://${supabaseHost}/storage/v1/object/public/property-images/${p.cover_image_path}`
      : null,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    size_sqm: p.size ?? undefined,
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const prevParams = new URLSearchParams();
  if (page - 1 > 1) prevParams.set("page", String(page - 1));
  const nextParams = new URLSearchParams();
  nextParams.set("page", String(page + 1));

  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Hero */}
      <section className="bg-[#3A2E4F] px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Golden Visa Greece
          </h1>
          <p className="text-[#D9D9D9] text-lg mb-8">
            Residency by investment — own property in Greece and gain access to the Schengen Area.
          </p>
          <GoldenVisaCTAButton className="bg-white text-[#3A2E4F] px-8 py-4 rounded-xl font-semibold hover:bg-[#F0EDF7] transition-colors">
            Start a Golden Visa Consultation
          </GoldenVisaCTAButton>
        </div>
      </section>

      {/* 2-column section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row gap-10">

          {/* Left: accordion (~35%) */}
          <div className="w-full md:w-[35%] md:sticky md:top-8 self-start">
            <GoldenVisaAccordionClient />
          </div>

          {/* Right: catalog (~65%) */}
          <div className="w-full md:w-[65%]">
            {properties.length === 0 ? (
              <div className="border border-[#D9D9D9] rounded-2xl p-8 flex flex-col gap-4 bg-white">
                <h2 className="text-lg font-semibold text-[#1E1E1E]">
                  Golden Visa Opportunities
                </h2>
                <p className="text-[#404040] text-sm leading-relaxed">
                  Selected opportunities are shared upon request.
                </p>
                <p className="text-[#888888] text-sm leading-relaxed">
                  Many qualifying opportunities are shared privately. Contact our advisor to receive curated options.
                </p>
                <GoldenVisaCTAButton className="self-start bg-[#3A2E4F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  Start a Golden Visa Consultation
                </GoldenVisaCTAButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>

                {(hasPrev || hasNext) && (
                  <div className="flex items-center gap-4 mt-10">
                    {hasPrev && (
                      <Link
                        href={`/golden-visa-greece${prevParams.toString() ? `?${prevParams}` : ""}`}
                        className="px-5 py-2 rounded-xl bg-[#3A2E4F] text-[#D9D9D9] text-sm font-medium hover:opacity-90 transition"
                      >
                        ← Prev
                      </Link>
                    )}
                    {hasNext && (
                      <Link
                        href={`/golden-visa-greece?${nextParams}`}
                        className="px-5 py-2 rounded-xl bg-[#3A2E4F] text-[#D9D9D9] text-sm font-medium hover:opacity-90 transition"
                      >
                        Load more →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}
