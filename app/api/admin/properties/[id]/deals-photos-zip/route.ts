import { type NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase() ?? "";
    const allowed = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    );
    return !!email && allowed.has(email);
  } catch {
    return false;
  }
}

// Fetch one image URL → ArrayBuffer. Returns null on any failure.
async function fetchImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// Derive a safe filename from the URL (last path segment, no query params).
function filenameFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).pop() ?? fallback;
    // Keep only safe characters; strip query strings that sneak in via URL.pathname
    return segment.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  } catch {
    return fallback;
  }
}

// GET /api/admin/properties/[id]/deals-photos-zip
// Returns a ZIP containing cover + gallery images for the property.
// All image fetching and ZIP assembly is done in memory — nothing written to disk.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch property using admin client so private/draft properties are accessible.
  const admin = createSupabaseAdminClient();
  const { data: property, error } = await admin
    .from("properties")
    .select(
      "id,property_code,title,slug,description,price_eur,location_text,cover_image_url,gallery_image_urls,featured,is_golden_visa,private_collection,status,publish_1choice,publish_deals,deals_status"
    )
    .eq("id", id)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Build ordered list of image URLs: cover first, then gallery.
  const urls: string[] = [];
  if (property.cover_image_url) urls.push(property.cover_image_url as string);
  const gallery = property.gallery_image_urls as string[] | null;
  if (Array.isArray(gallery)) {
    urls.push(...gallery.filter((u) => typeof u === "string" && u !== property.cover_image_url));
  }

  if (urls.length === 0) {
    return NextResponse.json({ error: "No images found for this property" }, { status: 404 });
  }

  // Fetch all images in parallel (in-memory, no disk I/O).
  const results = await Promise.all(
    urls.map(async (url, i) => {
      const buf = await fetchImage(url);
      const name = filenameFromUrl(url, `image_${i + 1}.jpg`);
      // Prefix: cover first, then gallery_01, gallery_02, …
      const prefix = i === 0 ? "cover_" : `gallery_${String(i).padStart(2, "0")}_`;
      return { name: `${prefix}${name}`, buf };
    })
  );

  // Assemble ZIP in memory.
  const zip = new JSZip();
  const folder = zip.folder(property.property_code ?? "photos")!;
  let added = 0;
  for (const { name, buf } of results) {
    if (buf) {
      folder.file(name, buf);
      added++;
    }
  }

  if (added === 0) {
    return NextResponse.json({ error: "Failed to download any images" }, { status: 502 });
  }

  // Add marketing package files: property.json, marketing-card.html, seo.txt, description.txt
  function buildExportJson(): object {
    return {
      id: property.id,
      property_code: property.property_code ?? null,
      title: property.title,
      slug: property.slug || property.property_code || "",
      description: property.description ?? null,
      price_eur: property.price_eur ?? null,
      location_text: property.location_text ?? null,
      cover_image_url: property.cover_image_url ?? null,
      gallery_image_urls: Array.isArray(property.gallery_image_urls) ? property.gallery_image_urls : [],
      flags: {
        featured: !!property.featured,
        is_golden_visa: !!property.is_golden_visa,
        private_collection: !!property.private_collection,
      },
      publishing: {
        status: property.status ?? "draft",
        publish_1choice: !!property.publish_1choice,
        publish_deals: !!property.publish_deals,
      },
    };
  }

  function buildSeoTitle(): string {
    const price = property.price_eur != null ? ` — €${new Intl.NumberFormat("en-EU").format(property.price_eur)}` : "";
    const location = property.location_text ? ` in ${property.location_text}` : "";
    return `${property.title}${location}${price} | 1ChoiceDeals`;
  }

  function buildMetaDescription(): string {
    const price = property.price_eur != null ? `€${new Intl.NumberFormat("en-EU").format(property.price_eur)} — ` : "";
    const location = property.location_text ? ` Located in ${property.location_text}.` : "";
    const desc = property.description && String(property.description).trim()
      ? String(property.description).trim().slice(0, 120) + (String(property.description).trim().length > 120 ? "…" : "")
      : `Featured property on 1ChoiceDeals.`;
    return `${price}${desc}${location}`;
  }

  function buildHtmlSnippet(): string {
    const price = property.price_eur != null ? `€${new Intl.NumberFormat("en-EU").format(property.price_eur)}` : null;
    const slug = property.slug || property.property_code || "";
    const ctaUrl = slug ? `https://1choice.gr/properties/${slug}` : "https://1choice.gr";
    const short = property.description ? String(property.description).trim().slice(0, 160) : null;
    const loc = property.location_text ?? null;
    const imgBlock = property.cover_image_url ? `\n  <img src="${property.cover_image_url}" alt="${property.title}" style="width:100%;height:200px;object-fit:cover;display:block;" />` : "";
    const priceBlock = price ? `\n  <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1E1E1E;">${price}</p>` : "";
    const locBlock = loc ? `\n  <p style="margin:0 0 10px;font-size:13px;color:#888888;">${loc}</p>` : "";
    const descBlock = short ? `\n  <p style="margin:0 0 16px;font-size:14px;color:#555555;line-height:1.5;">${short}${String(property.description).trim().length > 160 ? "…" : ""}</p>` : "";
    return `<div style="font-family:sans-serif;max-width:360px;border:1px solid #E8E8E8;border-radius:12px;overflow:hidden;background:#ffffff;">${imgBlock}\n  <div style="padding:16px;">${priceBlock}\n  <h3 style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1E1E1E;">${property.title}</h3>${locBlock}${descBlock}\n  <a href="${ctaUrl}" style="display:inline-block;padding:10px 20px;background:#1E1E1E;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">View Property</a>\n  </div>\n</div>`;
  }

  // Add metadata files to the root folder inside the ZIP
  const pkgFolder = zip.folder(property.property_code ?? "marketing_package")!;
  try {
    pkgFolder.file("property.json", JSON.stringify(buildExportJson(), null, 2));
    pkgFolder.file("marketing-card.html", buildHtmlSnippet());
    pkgFolder.file("seo.txt", `${buildSeoTitle()}\n\n${buildMetaDescription()}`);
    pkgFolder.file("description.txt", String(property.description ?? ""));
  } catch {
    // ignore errors writing small text files — ZIP still valid
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const code = property.property_code ?? id.slice(0, 8);
  // NextResponse expects BodyInit — wrap Buffer in Uint8Array for compatibility
  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="marketing_package_${code}.zip"`,
      "Content-Length": String(zipBuffer.byteLength),
    },
  });
}
