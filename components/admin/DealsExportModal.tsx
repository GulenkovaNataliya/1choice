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
  deals_status: string | null;
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

// ── HTML snippet generator ────────────────────────────────────────────────────
// Produces a self-contained, inline-styled HTML card for embedding in external
// channels (email newsletters, partner sites, WhatsApp previews, CMS blocks).
// Uses only inline styles — no class dependencies.

function buildHtmlSnippet(d: ExportData): string {
  const price  = d.price_eur != null ? `€${d.price_eur.toLocaleString("en-EU")}` : null;
  const slug   = d.slug || d.property_code || "";
  const ctaUrl = slug ? `https://1choice.gr/properties/${slug}` : "https://1choice.gr";
  const short  = d.description?.trim().slice(0, 160) ?? null;
  const loc    = d.location_text ?? null;

  const imgBlock = d.cover_image_url
    ? `\n  <img src="${d.cover_image_url}" alt="${d.title}" style="width:100%;height:200px;object-fit:cover;display:block;" />`
    : "";

  const priceBlock = price
    ? `\n  <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1E1E1E;">${price}</p>`
    : "";

  const locBlock = loc
    ? `\n  <p style="margin:0 0 10px;font-size:13px;color:#888888;">${loc}</p>`
    : "";

  const descBlock = short
    ? `\n  <p style="margin:0 0 16px;font-size:14px;color:#555555;line-height:1.5;">${short}${d.description!.trim().length > 160 ? "…" : ""}</p>`
    : "";

  return `<div style="font-family:sans-serif;max-width:360px;border:1px solid #E8E8E8;border-radius:12px;overflow:hidden;background:#ffffff;">${imgBlock}
  <div style="padding:16px;">${priceBlock}
  <h3 style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1E1E1E;">${d.title}</h3>${locBlock}${descBlock}
  <a href="${ctaUrl}" style="display:inline-block;padding:10px 20px;background:#1E1E1E;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">View Property</a>
  </div>
</div>`;
}

// ── SEO generators ─────────────────────────────────────────────────────────────
// Templates are intentionally simple and stable — no external deps.

function buildSeoTitle(d: ExportData): string {
  const price = d.price_eur != null ? ` — €${d.price_eur.toLocaleString("en-EU")}` : "";
  const location = d.location_text ? ` in ${d.location_text}` : "";
  return `${d.title}${location}${price} | 1ChoiceDeals`;
}

function buildMetaDescription(d: ExportData): string {
  const price = d.price_eur != null ? `€${d.price_eur.toLocaleString("en-EU")} — ` : "";
  const location = d.location_text ? ` Located in ${d.location_text}.` : "";
  const desc = d.description?.trim()
    ? d.description.trim().slice(0, 120) + (d.description.trim().length > 120 ? "…" : "")
    : `Featured property on 1ChoiceDeals.`;
  return `${price}${desc}${location}`;
}

type Props = {
  propertyId: string;
  onClose: () => void;
};

export default function DealsExportModal({ propertyId, onClose }: Props) {
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  // Which field was just copied — null means nothing copied yet / timeout passed
  const [copied, setCopied] = useState<string | null>(null);
  // Local deals_status mirrors DB value; updated optimistically on Mark as Published
  const [dealsStatus, setDealsStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data: row } = await getSupabase()
        .from("properties")
        .select(
          "id,property_code,title,slug,description,price_eur,location_text,cover_image_url,gallery_image_urls,featured,is_golden_visa,private_collection,status,publish_1choice,publish_deals,deals_status"
        )
        .eq("id", propertyId)
        .single();

      const parsed = row as ExportData ?? null;
      setData(parsed);
      setDealsStatus(parsed?.deals_status ?? "draft");
      setLoading(false);
      if (parsed) {
        logActivity(propertyId, "property_deals_export_opened", { property_code: parsed.property_code });
      }
    }
    fetch();
  }, [propertyId]);

  // Fire-and-forget: mark property as exported in DB after any copy action.
  // Uses authenticated browser client — prop_update_authenticated RLS policy covers this.
  function markExported() {
    if (dealsStatus !== "published") setDealsStatus("exported");
    getSupabase()
      .from("properties")
      .update({ deals_status: "exported", last_exported_at: new Date().toISOString() })
      .eq("id", propertyId)
      .then(() => {/* no-op — failure is silent, tracking is best-effort */});
  }

  async function handleDownloadPhotos() {
    if (!data || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/deals-photos-zip`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDownloadError(json.error ?? "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_package_${data.property_code ?? propertyId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Network error — please try again");
    } finally {
      setDownloading(false);
    }
  }

  async function handleMarkPublished() {
    if (!data || publishing) return;
    setPublishing(true);
    const { error } = await getSupabase()
      .from("properties")
      .update({ deals_status: "published" })
      .eq("id", propertyId);
    if (!error) {
      setDealsStatus("published");
      logActivity(propertyId, "property_deals_marked_published", { property_code: data.property_code });
    }
    setPublishing(false);
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    markExported();
  }

  async function handleCopyJson() {
    if (!data) return;
    await copyText(JSON.stringify(buildExportJson(data), null, 2), "json");
    logActivity(propertyId, "property_deals_export_copied", { property_code: data.property_code });
  }

  async function handleCopyHtml() {
    if (!data) return;
    await copyText(buildHtmlSnippet(data), "html");
  }

  async function handleCopySlug() {
    if (!data) return;
    await copyText(data.slug || data.property_code || "", "slug");
  }

  async function handleCopySeoTitle() {
    if (!data) return;
    await copyText(buildSeoTitle(data), "seo_title");
  }

  async function handleCopyMetaDesc() {
    if (!data) return;
    await copyText(buildMetaDescription(data), "meta_desc");
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
            Marketing Package
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
                    ["Cover URL",   data.cover_image_url ?? "—"],
                    ["Gallery",     `${galleryCount} image${galleryCount !== 1 ? "s" : ""}`],
                    ["Featured",    data.featured     ? "Yes" : "No"],
                    ["Golden Visa", data.is_golden_visa ? "Yes" : "No"],
                    ["Private",     data.private_collection ? "Yes" : "No"],
                    ["1Choice",     data.publish_1choice ? "Yes" : "No"],
                    ["Deals",       data.publish_deals   ? "Yes" : "No"],
                    ["Status",      data.status ?? "—"],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td className="py-2 pr-4 text-[#888888] whitespace-nowrap w-28">{label}</td>
                      <td className="py-2 text-[#1E1E1E] font-medium">
                        {label === "Cover URL" && value !== "—" ? (
                          <span className="font-mono text-xs break-all">{String(value)}</span>
                        ) : label === "Status" ? (
                          <span className="capitalize">{String(value)}</span>
                        ) : (
                          value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Export readiness checklist */}
              {(() => {
                const checks: { label: string; ok: boolean }[] = [
                  { label: "Title",              ok: !!data.title?.trim() },
                  { label: "Price",              ok: data.price_eur != null },
                  { label: "Description",        ok: !!data.description?.trim() },
                  { label: "Cover image",        ok: !!data.cover_image_url },
                  { label: "Gallery (≥ 1 img)",  ok: (data.gallery_image_urls?.length ?? 0) >= 1 },
                  { label: "Slug",               ok: !!(data.slug || data.property_code) },
                  { label: "Location",           ok: !!data.location_text?.trim() },
                ];
                const readyCount = checks.filter((c) => c.ok).length;
                return (
                  <div className="border border-[#E8E8E8] rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[#888888] uppercase tracking-widest">
                        Export Readiness
                      </p>
                      <span className={`text-xs font-semibold ${readyCount === checks.length ? "text-green-600" : "text-[#AAAAAA]"}`}>
                        {readyCount}/{checks.length}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {checks.map(({ label, ok }) => (
                        <li key={label} className="flex items-center gap-2 text-xs">
                          <span className={`shrink-0 w-4 text-center font-bold ${ok ? "text-green-600" : "text-red-400"}`}>
                            {ok ? "✓" : "✗"}
                          </span>
                          <span className={ok ? "text-[#1E1E1E]" : "text-[#AAAAAA]"}>{label}</span>
                          {!ok && <span className="text-[#CCCCCC] text-xs">missing</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* JSON preview */}
              <div>
                <p className="text-xs text-[#888888] uppercase tracking-widest mb-2">Export JSON</p>
                <pre className="bg-[#F4F4F4] rounded-lg p-4 text-xs text-[#1E1E1E] overflow-x-auto leading-relaxed">
                  {JSON.stringify(exportJson, null, 2)}
                </pre>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-[#AAAAAA] border-t border-[#F0F0F0] pt-3">
                This is an export preview. No data is sent automatically.
              </p>

              {downloadError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {downloadError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E8E8E8] flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555555] hover:text-[#1E1E1E] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPhotos}
            disabled={!data || loading || downloading}
            className="px-3 py-2 bg-[#F4F4F4] text-[#1E1E1E] text-sm font-semibold rounded-lg hover:bg-[#E8E8E8] transition disabled:opacity-40 disabled:cursor-default"
          >
            {downloading ? "Zipping…" : "Download Marketing Package"}
          </button>
          {dealsStatus !== "published" && (
            <button
              onClick={handleMarkPublished}
              disabled={!data || loading || publishing}
              className="px-3 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition disabled:opacity-40 disabled:cursor-default"
            >
              {publishing ? "Saving…" : "Mark as Published"}
            </button>
          )}
          {dealsStatus === "published" && (
            <span className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-200">
              Published ✓
            </span>
          )}
          <button
            onClick={handleCopyHtml}
            disabled={!data || loading}
            className="px-3 py-2 bg-[#F4F4F4] text-[#1E1E1E] text-sm font-semibold rounded-lg hover:bg-[#E8E8E8] transition disabled:opacity-40 disabled:cursor-default"
          >
            {copied === "html" ? "Copied!" : "Copy Marketing Card"}
          </button>
          <button
            onClick={handleCopySlug}
            disabled={!data || loading}
            className="px-3 py-2 bg-[#F4F4F4] text-[#1E1E1E] text-sm font-semibold rounded-lg hover:bg-[#E8E8E8] transition disabled:opacity-40 disabled:cursor-default"
          >
            {copied === "slug" ? "Copied!" : "Copy Slug"}
          </button>
          <button
            onClick={handleCopySeoTitle}
            disabled={!data || loading}
            className="px-3 py-2 bg-[#F4F4F4] text-[#1E1E1E] text-sm font-semibold rounded-lg hover:bg-[#E8E8E8] transition disabled:opacity-40 disabled:cursor-default"
          >
            {copied === "seo_title" ? "Copied!" : "Copy SEO Title"}
          </button>
          <button
            onClick={handleCopyMetaDesc}
            disabled={!data || loading}
            className="px-3 py-2 bg-[#F4F4F4] text-[#1E1E1E] text-sm font-semibold rounded-lg hover:bg-[#E8E8E8] transition disabled:opacity-40 disabled:cursor-default"
          >
            {copied === "meta_desc" ? "Copied!" : "Copy Meta Desc"}
          </button>
          <button
            onClick={handleCopyJson}
            disabled={!data || loading}
            className="px-3 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition disabled:opacity-40 disabled:cursor-default min-w-[100px]"
          >
            {copied === "json" ? "Copied!" : "Copy JSON"}
          </button>
        </div>

      </div>
    </div>
  );
}
