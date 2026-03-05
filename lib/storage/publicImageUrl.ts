// Re-exported for backwards compatibility.
// Uses the render endpoint at catalog size (width=600, quality=75).
import { renderImageUrl } from "@/lib/storage/imageUrl";

export function publicImageUrl(path: string, _bucket = "property-images"): string {
  return renderImageUrl(path, "catalog", _bucket) ?? "";
}
