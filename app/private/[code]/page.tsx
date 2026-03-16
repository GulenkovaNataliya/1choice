import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderImageUrl } from "@/lib/storage/imageUrl";
import PrivatePropertyDetail from "./PrivatePropertyDetail";

/*
 * Required Supabase table (create once in the dashboard):
 *
 *   CREATE TABLE property_access_tokens (
 *     id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
 *     token       text        NOT NULL UNIQUE,
 *     property_id uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 *     created_at  timestamptz DEFAULT now()
 *   );
 *
 * Column mapping:
 *   token       → secure random string shared in private links (/private/<token>)
 *   property_id → FK to properties.id
 *   created_at  → DB default, not inserted manually
 */

// Never index private pages
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PrivateTokenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // `code` is the URL segment — treated as a secure access token
  const { code: token } = await params;

  const supabase = await createSupabaseServerClient();

  // 1. Resolve token → property_id
  const { data: tokenRow } = await supabase
    .from("property_access_tokens")
    .select("property_id")
    .eq("token", token)
    .single();

  if (!tokenRow?.property_id) notFound();

  // 2. Fetch the linked property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", tokenRow.property_id)
    .single();

  if (!property) notFound();

  // 3. Must be a private_collection property
  if (property.private_collection !== true) notFound();

  // 4. Resolve cover image URL
  const coverUrl = renderImageUrl(
    property.cover_image_url ?? property.cover_image_path,
    "gallery"
  );

  return <PrivatePropertyDetail property={property} coverUrl={coverUrl} />;
}
