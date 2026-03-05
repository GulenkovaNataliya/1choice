/**
 * Supabase Storage image transformation utility.
 *
 * Presets:
 *   gallery  → width=1200, quality=80  (property detail hero / gallery)
 *   catalog  → width=600,  quality=75  (property cards / listing)
 *   admin    → width=300               (admin upload previews)
 *
 * Accepts:
 *   - Storage path    e.g. "properties/code0007/photo.jpg"
 *   - Full object URL e.g. "https://.../storage/v1/object/public/property-images/..."
 *   - Existing render URL — query params are replaced with the preset
 *   - External URL    (not Supabase) — returned unchanged
 */

export type ImagePreset = "gallery" | "catalog" | "admin";

const PARAMS: Record<ImagePreset, string> = {
  gallery: "width=1200&quality=80",
  catalog: "width=600&quality=75",
  admin:   "width=300",
};

const DEFAULT_BUCKET = "property-images";

function supabaseOrigin(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
}

function extractPath(src: string, bucket: string): string | null {
  const patterns = [
    new RegExp(`/storage/v1/object/public/${bucket}/([^?]+)`),
    new RegExp(`/storage/v1/render/image/public/${bucket}/([^?]+)`),
  ];
  for (const re of patterns) {
    const m = src.match(re);
    if (m) return m[1];
  }
  return null;
}

export function renderImageUrl(
  src: string | null | undefined,
  preset: ImagePreset,
  bucket = DEFAULT_BUCKET
): string | null {
  if (!src) return null;

  const origin = supabaseOrigin();
  const qs = PARAMS[preset];

  // Supabase storage URL (object or render) — normalise to render endpoint
  if (src.includes("/storage/v1/")) {
    const path = extractPath(src, bucket);
    if (path) {
      return `${origin}/storage/v1/render/image/public/${bucket}/${path}?${qs}`;
    }
  }

  // Relative / bare path — treat as storage path
  if (!src.startsWith("http")) {
    return `${origin}/storage/v1/render/image/public/${bucket}/${src}?${qs}`;
  }

  // External URL — return unchanged
  return src;
}
