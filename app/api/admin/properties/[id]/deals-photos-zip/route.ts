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
    .select("property_code, cover_image_url, gallery_image_urls")
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

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const code = property.property_code ?? id.slice(0, 8);
  // NextResponse expects BodyInit — wrap Buffer in Uint8Array for compatibility
  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="deals_photos_${code}.zip"`,
      "Content-Length": String(zipBuffer.byteLength),
    },
  });
}
