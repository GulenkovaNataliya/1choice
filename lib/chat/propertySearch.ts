/**
 * Server-side property search helper for the chatbot.
 * Queries published, verified properties from Supabase.
 * Only called from the /api/chat route handler — never shipped in the browser bundle.
 *
 * Visibility rules (same as /properties/[slug] page):
 *   status = 'published'  AND  publish_1choice = true  AND  vip IS NOT true
 */

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

// ── Public result type ─────────────────────────────────────────────────────────

export type ChatProperty = {
  id:            string;
  title:         string;
  slug:          string;
  property_code: string | null;
  location_text: string | null;
  size:          number | null;   // sqm
  bedrooms:      number | null;
  price:         number | null;   // price_eur if present, else price
};

// ── Criteria type ──────────────────────────────────────────────────────────────

export type SearchCriteria = {
  locationSlug: string | null;
  maxPrice:     number | null;
  minBedrooms:  number | null;
  goldenVisa:   boolean;
};

// ── Dynamic location map — fetched from DB, cached per server instance ─────────
// Falls back to empty map if DB is unreachable; classification still works via
// the static DISCOVERY_RE regex patterns in /api/chat/route.ts.

type LocationRow = { name: string; slug: string };
let _locationMapCache: [string, string][] | null = null;

async function getLocationMap(): Promise<[string, string][]> {
  if (_locationMapCache) return _locationMapCache;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select("name,slug")
    .eq("is_active", true);

  if (error || !data) {
    console.error("[chat/propertySearch] location map fetch error:", error?.message);
    return [];
  }

  // Sort longest name first so "vouliagmeni" matches before "voula"
  const map = (data as LocationRow[])
    .map(r => [r.name.toLowerCase(), r.slug] as [string, string])
    .sort((a, b) => b[0].length - a[0].length);

  _locationMapCache = map;
  return map;
}

async function extractLocation(message: string): Promise<string | null> {
  const lower = message.toLowerCase();
  const map = await getLocationMap();
  for (const [keyword, slug] of map) {
    if (lower.includes(keyword)) return slug;
  }
  return null;
}

// ── Budget extraction ─────────────────────────────────────────────────────────
// Handles: "500k", "€500,000", "1.5 million", "budget of 800 000", "€1m"
// Ignores numbers that look like bedroom/sqm counts (< 50 000 after conversion).

function extractMaxPrice(message: string): number | null {
  const re =
    /€?\$?\s*([\d][\d\s,]*(?:\.\d+)?)\s*(k|m|million|thousand)?(?!\s*(?:bed|bath|floor|storey|room|sqm|sq|m²|m2))/gi;
  const candidates: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    const raw = parseFloat(m[1].replace(/[\s,]/g, ""));
    if (isNaN(raw) || raw <= 0) continue;
    const suffix = (m[2] ?? "").toLowerCase();
    let val = raw;
    if (suffix === "m" || suffix === "million") val = raw * 1_000_000;
    else if (suffix === "k" || suffix === "thousand") val = raw * 1_000;
    if (val >= 50_000) candidates.push(val);
  }
  return candidates.length > 0 ? Math.max(...candidates) : null;
}

// ── Bedroom extraction ─────────────────────────────────────────────────────────

function extractBedrooms(message: string): number | null {
  const m = message.match(/(\d)\s*\+?\s*(?:bed(?:room)?s?|br\b)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Parse criteria from a free-text message ───────────────────────────────────

export async function parseCriteria(message: string): Promise<SearchCriteria> {
  return {
    locationSlug: await extractLocation(message),
    maxPrice:     extractMaxPrice(message),
    minBedrooms:  extractBedrooms(message),
    goldenVisa:   /golden\s*visa/i.test(message),
  };
}

// ── Check if criteria contains enough signal to query ─────────────────────────

export function hasCriteria(criteria: SearchCriteria): boolean {
  return !!(
    criteria.locationSlug ||
    criteria.maxPrice ||
    criteria.minBedrooms ||
    criteria.goldenVisa
  );
}

// ── Internal row type (matches the selected columns) ──────────────────────────

type PropertyRow = {
  id:            string;
  title:         string;
  slug:          string;
  property_code: string | null;
  location:      string | null;
  location_text: string | null;
  size:          number | null;
  bedrooms:      number | null;
  price:         number | null;
  price_eur:     number | null;
  vip:           boolean | null;
};

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchProperties(
  criteria: SearchCriteria,
  limit = 2,
): Promise<ChatProperty[]> {
  const admin = createSupabaseAdminClient();

  let q = admin
    .from("properties")
    .select(
      "id,title,slug,property_code,location,location_text,size,bedrooms,price,price_eur,vip"
    )
    .eq("status", "published")
    .eq("publish_1choice", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (criteria.locationSlug) {
    q = q.eq("location", criteria.locationSlug);
  }

  if (criteria.minBedrooms) {
    q = q.gte("bedrooms", criteria.minBedrooms);
  }

  if (criteria.goldenVisa) {
    q = q.eq("is_golden_visa", true);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[chat/propertySearch] query error:", error.message);
    return [];
  }

  const rows = (data ?? []) as PropertyRow[];

  // Post-filter: exclude VIP (neq in PostgREST excludes NULLs, so handle in JS)
  const visible = rows.filter((r) => r.vip !== true);

  // Post-filter: budget (uses price_eur if present, falls back to price)
  const priceFiltered = criteria.maxPrice
    ? visible.filter((r) => {
        const eff = r.price_eur ?? r.price ?? null;
        return eff === null || eff <= criteria.maxPrice!;
      })
    : visible;

  return priceFiltered.slice(0, limit).map((r) => ({
    id:            r.id,
    title:         r.title,
    slug:          r.slug,
    property_code: r.property_code,
    location_text: r.location_text ?? r.location,
    size:          r.size,
    bedrooms:      r.bedrooms,
    price:         r.price_eur ?? r.price,
  }));
}
