"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/logActivity";

type ExportData = {
  id: string;
  property_code: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  price_eur: number | null;
  location_text: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  featured: boolean | null;
  is_golden_visa: boolean | null;
  private_collection: boolean | null;
  status: string | null;
  publish_1choice: boolean | null;
  publish_deals: boolean | null;
};

function buildExportJson(d: ExportData): object {
  return {
    id: d.id,
    property_code: d.property_code ?? null,
    title: d.title,
    slug: d.slug || d.property_code || "",
    description: d.description ?? null,
    price_eur: d.price_eur ?? null,
    location_text: d.location_text ?? null,
    cover_image_url: d.cover_image_url ?? null,
    gallery_image_urls: d.gallery_image_urls ?? [],
    flags: {
      featured: d.featured ?? false,
      is_golden_visa: d.is_golden_visa ?? false,
      private_collection: d.private_collection ?? false,
    },
    publishing: {
      status: d.status ?? "draft",
      publish_1choice: d.publish_1choice ?? false,
      publish_deals: d.publish_deals ?? false,
    },
  };
}

type Props = {
  propertyId: string;
  onClose: () => void;
};

export default function DealsExportModal({ propertyId, onClose }: Props) {
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data: row } = await getSupabase()
        .from("properties")
        .select(
          "id,property_code,title,slug,description,price_eur,location_text,cover_image_url,gallery_image_urls,featured,is_golden_visa,private_collection,status,publish_1choice,publish_deals"
        )
        .eq("id", propertyId)
        .single();

      const parsed = row as ExportData ?? null;
      setData(parsed);
      setLoading(false);
      if (parsed) {
        logActivity(propertyId, "property_deals_export_opened", { property_code: parsed.property_code });
      }
    }
    fetch();
  }, [propertyId]);

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(buildExportJson(data), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logActivity(propertyId, "property_deals_export_copied", { property_code: data.property_code });
  }

  const exportJson = data ? buildExportJson(data) : null;
  const galleryCount = data?.gallery_image_urls?.length ?? 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest">
            Deals Export
          </h2>
          <button
            onClick={onClose}
            className="text-[#AAAAAA] hover:text-[#1E1E1E] transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-[#888888]">Loading…</p>
          ) : !data ? (
            <p className="text-sm text-red-500">Failed to load property data.</p>
          ) : (
            <>
              {/* Summary rows */}
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#F4F4F4]">
                  {[
                    ["Code",        data.property_code ?? "—"],
                    ["Title",       data.title],
                    ["Slug",        data.slug || data.property_code || "—"],
                    ["Price (€)",   data.price_eur != null ? data.price_eur.toLocaleString("en-EU") : "—"],
                    ["Location",    data.location_text ?? "—"],
                    ["Cover URL",   data.cover_image_url
                      ? <span className="font-mono text-xs break-all">{data.cover_image_url}</span>
                      : "—"],
                    ["Gallery",     `${galleryCount} image${galleryCount !== 1 ? "s" : ""}`],
                    ["Featured",    data.featured     ? "Yes" : "No"],
                    ["Golden Visa", data.is_golden_visa ? "Yes" : "No"],
                    ["Private",     data.private_collection ? "Yes" : "No"],
                    ["1Choice",     data.publish_1choice ? "Yes" : "No"],
                    ["Deals",       data.publish_deals   ? "Yes" : "No"],
                    ["Status",      <span className="capitalize">{data.status ?? "—"}</span>],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td className="py-2 pr-4 text-[#888888] whitespace-nowrap w-28">{label}</td>
                      <td className="py-2 text-[#1E1E1E] font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* JSON preview */}
              <div>
                <p className="text-xs text-[#888888] uppercase tracking-widest mb-2">Export JSON</p>
                <pre className="bg-[#F4F4F4] rounded-lg p-4 text-xs text-[#1E1E1E] overflow-x-auto leading-relaxed">
                  {JSON.stringify(exportJson, null, 2)}
                </pre>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-[#AAAAAA] border-t border-[#F0F0F0] pt-3">
                This is an export preview for 1ChoiceDeals. No data is sent automatically.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            disabled={!data || loading}
            className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-40 disabled:cursor-default min-w-[100px]"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        </div>

      </div>
    </div>
  );
}
