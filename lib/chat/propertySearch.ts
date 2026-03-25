/**
 * Server-side property search helper for the chatbot.
 * Queries published, verified properties from Supabase.
 * Only called from the /api/chat route handler — never shipped in the browser bundle.
 *
 * Visibility rules (same as /properties/[slug] page):
 *   status = 'published'  AND  publish_1choice = true
 *   AND  private_collection IS NOT true
 */

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

// ── Public result type ─────────────────────────────────────────────────────────

export type ChatProperty = {
  id:            string;
  title:         string;
  slug:          string;
  property_code: string | null;
  location_text: string | null;
  size:          number | null;   // size_sqm
  bedrooms:      number | null;
  price:         number | null;   // price_eur if present, else price
};

export type SearchResult = {
  results:  ChatProperty[];
  isExact:  boolean;   // false = relaxed fallback; AI should say "closest alternatives"
};

// ── Criteria type ──────────────────────────────────────────────────────────────

export type SearchCriteria = {
  // ── 262.22 ─────────────────────────────────────────────────────────────────
  locationSlug:    string | null;
  maxPrice:        number | null;
  minBedrooms:     number | null;
  goldenVisa:      boolean;
  minSize:         number | null;
  maxSize:         number | null;
  subtype:         string | null;
  seaView:         boolean;
  // ── 262.23 ─────────────────────────────────────────────────────────────────
  transactionType: "sale" | "rent" | "antiparochi" | null;
  minBathrooms:    number | null;
  furnished:       "any" | "fully" | null;
  heating:         boolean;
  cooling:         boolean;
  pool:            boolean;
  garden:          boolean;
  elevator:        boolean;
  // ── 262.24 ─────────────────────────────────────────────────────────────────
  minPrice:        number | null;
  category:        "residential" | "commercial" | "land" | "hotel" | null;
  // ── 262.25 ─────────────────────────────────────────────────────────────────
  parking:         boolean;
};

// ── Dynamic location map ───────────────────────────────────────────────────────

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
//
// extractMaxPrice — "under 500k", "budget 800k", "€1.5m"
// extractMinPrice — "from 500k", "above 500k", "от 500к", "από 500χ"
//
// Shared helper: parse a raw number + optional k/m/million/тыс/млн suffix.

function parseAmount(rawNum: string, suffix: string): number | null {
  const raw = parseFloat(rawNum.replace(/[\s,_]/g, ""));
  if (isNaN(raw) || raw <= 0) return null;
  const s = suffix.toLowerCase();
  let val = raw;
  if (s === "m" || s === "million" || s === "млн" || s === "εκ") val = raw * 1_000_000;
  else if (s === "k" || s === "thousand" || s === "тыс" || s === "χιλ" || s === "χ") val = raw * 1_000;
  return val >= 50_000 ? val : null;
}

function extractMaxPrice(message: string): number | null {
  const re =
    /€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(k|m|million|thousand|тыс|млн|εκ|χιλ|χ)?(?!\s*(?:bed|bath|floor|storey|room|sqm|sq|m²|m2|кв|τ\.μ))/gi;
  const candidates: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    const v = parseAmount(m[1], m[2] ?? "");
    if (v !== null) candidates.push(v);
  }
  return candidates.length > 0 ? Math.max(...candidates) : null;
}

function extractMinPrice(message: string): number | null {
  // English: "from N", "starting at N", "above N", "over N", "minimum N", "at least N", "budget above N"
  // Russian: "от N" (e.g. "от 500к", "от €500,000")
  // Greek:   "από N" (e.g. "από 500χ", "από €500,000")
  const patterns = [
    /(?:from|starting\s+at|above|over|minimum|at\s+least|budget\s+above|no\s+less\s+than)\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(k|m|million|thousand)?/i,
    /\bот\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(тыс|млн|k|m)?/i,
    /\bαπό\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(χιλ|εκ|k|m)?/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m) {
      const v = parseAmount(m[1], m[2] ?? "");
      if (v !== null) return v;
    }
  }
  return null;
}

// ── Bedroom extraction ─────────────────────────────────────────────────────────
// EN: "2 bedrooms", "2 bed"
// RU: "2 спальни", "2 комнаты"
// EL: "2 υπνοδωμάτια"

function extractBedrooms(message: string): number | null {
  const m =
    message.match(/(\d)\s*\+?\s*(?:bed(?:room)?s?|br\b)/i) ??
    message.match(/(\d)\s*(?:спальн|комнат)/i) ??
    message.match(/(\d)\s*(?:υπνοδωμάτι)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Bathroom extraction ───────────────────────────────────────────────────────
// EN: "2 bathrooms", "2 baths"
// RU: "2 ванных", "2 ванные"
// EL: "2 μπάνια"

function extractBathrooms(message: string): number | null {
  const m =
    message.match(/(\d)\s*\+?\s*(?:bath(?:room)?s?|wc\b)/i) ??
    message.match(/(\d)\s*(?:ванн)/i) ??
    message.match(/(\d)\s*(?:μπάνι)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Size extraction ────────────────────────────────────────────────────────────
// EN: "50 sqm", "50 m²", "50 sq.m"
// RU: "50 кв.м", "50 кв м", "50 квадратных метров"
// EL: "50 τ.μ.", "50 τετραγωνικά"

function extractSize(message: string): { minSize: number | null; maxSize: number | null } {
  const lower = message.toLowerCase();

  // Size unit — EN + RU + EL
  const unitRe = /sqm|sq\.?\s*m\b|m²|m2|square\s*met|кв\.?\s*м|квадратных|τ\.?\s*μ\.?|τετραγωνικ/i;

  // Explicit range
  const rangeM =
    lower.match(/between\s+(\d+)\s+and\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ)/) ??
    lower.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ)/);
  if (rangeM) {
    const a = parseInt(rangeM[1], 10);
    const b = parseInt(rangeM[2], 10);
    if (!isNaN(a) && !isNaN(b)) return { minSize: Math.min(a, b), maxSize: Math.max(a, b) };
  }

  // Upper bound
  const upperM = lower.match(
    /(?:under|max(?:imum)?|up\s+to|less\s+than|до)\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ)/
  );
  if (upperM) {
    const v = parseInt(upperM[1], 10);
    if (!isNaN(v)) return { minSize: null, maxSize: v };
  }

  // Lower bound
  const lowerM = lower.match(
    /(?:at\s+least|min(?:imum)?|more\s+than|over|от|από)\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ)/
  );
  if (lowerM) {
    const v = parseInt(lowerM[1], 10);
    if (!isNaN(v)) return { minSize: v, maxSize: null };
  }

  // Bare target "N sqm/кв.м/τ.μ." → ±30% band
  if (unitRe.test(lower)) {
    const m = lower.match(
      /(\d{2,4})\s*(?:sqm|sq\.?\s*m\b|m²|m2|square|кв\.?\s*м|квадратных|τ\.?\s*μ\.?|τετραγωνικ)/
    );
    if (m) {
      const v = parseInt(m[1], 10);
      if (!isNaN(v) && v >= 10 && v <= 10_000) {
        return { minSize: Math.round(v * 0.7), maxSize: Math.round(v * 1.3) };
      }
    }
  }

  return { minSize: null, maxSize: null };
}

// ── Category extraction ───────────────────────────────────────────────────────
// DB values: "residential" | "commercial" | "land" | "hotel"
// Only set when user clearly means a non-residential asset class.
// Residential is the default — do not set category for apartment/villa/etc.
// (those are handled by subtype).

function extractCategory(message: string): "residential" | "commercial" | "land" | "hotel" | null {
  if (/\b(?:land\b|plot\b|οικόπεδ|земл[яюе]|участок)\b/i.test(message)) return "land";
  if (/\b(?:commercial|office\b|shop\b|retail\b|εμπορικ|коммерческ)/i.test(message)) return "commercial";
  if (/\b(?:hotel\b|hospitality\b|ξενοδοχ|гостиниц|отель)/i.test(message)) return "hotel";
  return null;
}

// ── Subtype extraction (residential only) ────────────────────────────────────
// EN + RU + EL equivalents.
// land/commercial handled by category — not listed here.

const SUBTYPE_KEYWORDS: [RegExp, string][] = [
  // studio: EN + RU + EL
  [/\bstudio\b|\bстудия\b|\bστούντιο\b/i,                                                "studio"],
  // apartment: EN + RU (квартира) + EL (διαμέρισμα)
  [/\bapartment\b|\bapartements?\b|\bквартир[ауы]?\b|\bδιαμέρισμ/i,                      "apartment"],
  // maisonette: EN + RU + EL
  [/\bmaisonette\b|\bduplex\b|\bмезонет\b|\bтаунхаус\b|\bμεζονέτ/i,                     "maisonette"],
  // villa: EN + RU + EL
  [/\bvilla\b|\bвилл[аы]\b|\bβίλ[αε]?/i,                                                "villa"],
  // house: EN + RU + EL
  [/\bhouse\b|\bdetached\b|\bдом\b|\bκατοικί|\bμονοκατοικί/i,                           "house"],
  // penthouse: EN + RU
  [/\bpenthouse\b|\bпентхаус\b/i,                                                        "penthouse"],
  // loft: EN + RU
  [/\bloft\b|\bлофт\b/i,                                                                 "loft"],
];

function extractSubtype(message: string): string | null {
  for (const [re, value] of SUBTYPE_KEYWORDS) {
    if (re.test(message)) return value;
  }
  return null;
}

// ── Sea view extraction ───────────────────────────────────────────────────────
// EN + RU (вид на море) + EL (θέα θάλασσα)

function extractSeaView(message: string): boolean {
  return /\bsea[-\s]?view\b|\bseaview\b|\bwith\s+sea\b|\bocean\s+view\b|\bвид\s+на\s+море\b|\bморской\s+вид\b|\bθέα\s+θάλασσ|\bθαλασσ[αίο]+\s*θέα/i.test(message);
}

// ── Transaction type extraction ───────────────────────────────────────────────
// EN + RU + EL

function extractTransactionType(message: string): "sale" | "rent" | "antiparochi" | null {
  if (/\bantiparochi\b/i.test(message)) return "antiparochi";
  if (/\bfor\s+sale\b|\bto\s+buy\b|\bpurchase\b|\bbuying\b|\bbuy\b|\bпокупк|\bкупить\b|\bпродаётся\b|\bαγορ[αά]|\bπρος\s+πώλη/i.test(message)) return "sale";
  if (/\bfor\s+rent\b|\bto\s+rent\b|\brental\b|\brenting\b|\brent\b|\bаренд|\bснять\b|\bенοικί|\bπρος\s+ενοικί/i.test(message)) return "rent";
  return null;
}

// ── Furnished extraction ──────────────────────────────────────────────────────
// EN + RU (меблированная, с мебелью) + EL (επιπλωμένο)

function extractFurnished(message: string): "any" | "fully" | null {
  if (/\bnot\s+furnished\b|\bunfurnished\b|\bнемеблированн|\bχωρίς\s+έπιπλ/i.test(message)) return null;
  if (/\bfully\s+furnished\b|\bfull\s+furnished\b|\bполностью\s+меблир/i.test(message)) return "fully";
  if (/\bfurnished\b|\bмеблир|\bс\s+мебелью\b|\bεπιπλωμέν/i.test(message)) return "any";
  return null;
}

// ── Heating / cooling extraction ──────────────────────────────────────────────
// EN + RU + EL

function extractHeating(message: string): boolean {
  return /\bheating\b|\bcentral\s+heat|\bheat\s+pump\b|\bunderfloor\s+heat|\bwith\s+heat|\bотопление\b|\bотопл|\bθέρμανσ/i.test(message);
}

function extractCooling(message: string): boolean {
  return /\bcooling\b|\bair[-\s]?con(?:ditioning)?\b|\ba\/c\b|\bac\b|\bsplit\s+unit|\bclimate\s+control|\bкондиционер\b|\bκλιματισμ/i.test(message);
}

// ── Boolean amenities ────────────────────────────────────────────────────────
// EN + RU + EL

function extractPool(message: string): boolean {
  return /\bpool\b|\bswimming\b|\bбассейн\b|\bπισίν/i.test(message);
}

function extractGarden(message: string): boolean {
  return /\bgarden\b|\byard\b|\boutdoor\s+space|\bсад\b|\bκήπ/i.test(message);
}

function extractElevator(message: string): boolean {
  return /\belevator\b|\blift\b|\bwith\s+lift\b|\bwith\s+elevator\b|\bлифт\b|\bασανσέρ/i.test(message);
}

// ── Parking extraction ────────────────────────────────────────────────────────
// EN: "parking", "garage", "with parking", "parking space"
// RU: "парковка", "с парковкой", "гараж"
// EL: "στάθμευση", "πάρκινγκ"

function extractParking(message: string): boolean {
  return /\bparking\b|\bgarage\b|\bparking\s+space\b|\bпарковк|\bгараж\b|\bσταθμευσ|\bπάρκινγκ/i.test(message);
}

// ── Golden Visa ───────────────────────────────────────────────────────────────

function extractGoldenVisa(message: string): boolean {
  return /golden\s*visa|\bзолотая\s+виза\b|\bχρυσή\s+βίζα\b/i.test(message);
}

// ── Parse all criteria ────────────────────────────────────────────────────────

export async function parseCriteria(message: string): Promise<SearchCriteria> {
  const { minSize, maxSize } = extractSize(message);
  return {
    locationSlug:    await extractLocation(message),
    maxPrice:        extractMaxPrice(message),
    minPrice:        extractMinPrice(message),
    minBedrooms:     extractBedrooms(message),
    goldenVisa:      extractGoldenVisa(message),
    minSize,
    maxSize,
    subtype:         extractSubtype(message),
    seaView:         extractSeaView(message),
    transactionType: extractTransactionType(message),
    minBathrooms:    extractBathrooms(message),
    furnished:       extractFurnished(message),
    heating:         extractHeating(message),
    cooling:         extractCooling(message),
    pool:            extractPool(message),
    garden:          extractGarden(message),
    elevator:        extractElevator(message),
    category:        extractCategory(message),
    parking:         extractParking(message),
  };
}

// ── hasCriteria ───────────────────────────────────────────────────────────────

export function hasCriteria(criteria: SearchCriteria): boolean {
  return !!(
    criteria.locationSlug    ||
    criteria.maxPrice        ||
    criteria.minPrice        ||
    criteria.minBedrooms     ||
    criteria.goldenVisa      ||
    criteria.minSize         ||
    criteria.maxSize         ||
    criteria.subtype         ||
    criteria.seaView         ||
    criteria.transactionType ||
    criteria.minBathrooms    ||
    criteria.furnished       ||
    criteria.heating         ||
    criteria.cooling         ||
    criteria.pool            ||
    criteria.garden          ||
    criteria.elevator        ||
    criteria.parking         ||
    criteria.category
  );
}

// ── Internal row type ─────────────────────────────────────────────────────────

type PropertyRow = {
  id:            string;
  title:         string;
  slug:          string;
  property_code: string | null;
  location:      string | null;
  location_text: string | null;
  size_sqm:      number | null;
  bedrooms:      number | null;
  price:         number | null;
  price_eur:     number | null;
  private_collection: boolean | null;
};

const FURNISHED_ANY = ["Fully Furnished", "Partially Furnished", "Kitchen Only", "With Appliances"];

// ── Core query builder ────────────────────────────────────────────────────────
// Builds a Supabase query from criteria.
// `relaxed = true` drops secondary feature flags so a fallback set can be found
// when the exact query returns no results.

function buildQuery(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  criteria: SearchCriteria,
  relaxed: boolean,
) {
  let q = admin
    .from("properties")
    .select(
      "id,title,slug,property_code,location,location_text,size_sqm,bedrooms,price,price_eur,private_collection"
    )
    .eq("status", "published")
    .eq("publish_1choice", true)
    .or("private_collection.is.null,private_collection.eq.false")
    .order("featured",    { ascending: false })
    .order("created_at",  { ascending: false })
    .limit(50);

  // ── Core structural filters (always applied) ───────────────────────────────
  if (criteria.locationSlug)    q = q.eq("location",         criteria.locationSlug);
  if (criteria.transactionType) q = q.eq("transaction_type", criteria.transactionType);
  if (criteria.category)        q = q.eq("category",         criteria.category);
  if (criteria.goldenVisa)      q = q.eq("is_golden_visa",   true);
  if (criteria.minBedrooms)     q = q.gte("bedrooms",        criteria.minBedrooms);
  if (criteria.subtype)         q = q.ilike("subtype",       `%${criteria.subtype}%`);
  if (criteria.minSize)         q = q.gte("size_sqm",        criteria.minSize);
  if (criteria.maxSize)         q = q.lte("size_sqm",        criteria.maxSize);
  if (criteria.minBathrooms)    q = q.gte("bathrooms",       criteria.minBathrooms);

  // ── Secondary / feature filters (dropped in relaxed mode) ─────────────────
  if (!relaxed) {
    if (criteria.seaView)              q = q.eq("sea_view", true);
    if (criteria.pool)                 q = q.eq("pool",     true);
    if (criteria.garden)               q = q.eq("garden",   true);
    if (criteria.elevator)             q = q.eq("elevator", true);
    if (criteria.parking)              q = q.eq("parking",  true);
    if (criteria.furnished === "fully") q = q.eq("furnished", "Fully Furnished");
    else if (criteria.furnished === "any") q = q.in("furnished", FURNISHED_ANY);
    if (criteria.heating) {
      q = q.not("heating_type", "is", null);
      q = q.neq("heating_type", "none");
    }
    if (criteria.cooling) {
      q = q.not("cooling_type", "is", null);
      q = q.neq("cooling_type", "none");
    }
  }

  return q;
}

// ── Post-filter: apply price bounds (JS-side, covers price_eur + price) ──────

function applyPriceFilter(rows: PropertyRow[], criteria: SearchCriteria): PropertyRow[] {
  return rows.filter((r) => {
    const eff = r.price_eur ?? r.price ?? null;
    if (eff === null) return true;   // price unknown → include
    if (criteria.minPrice && eff < criteria.minPrice) return false;
    if (criteria.maxPrice && eff > criteria.maxPrice) return false;
    return true;
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchProperties(
  criteria: SearchCriteria,
  limit = 2,
): Promise<SearchResult> {
  const admin = createSupabaseAdminClient();

  // ── Exact query ─────────────────────────────────────────────────────────────
  const { data: exactData, error: exactError } = await buildQuery(admin, criteria, false);

  if (exactError) {
    console.error("[chat/propertySearch] exact query error:", exactError.message);
    return { results: [], isExact: true };
  }

  const exactRows = (exactData ?? []) as PropertyRow[];
  const exactVisible  = exactRows.filter(r => r.private_collection !== true);
  const exactFiltered = applyPriceFilter(exactVisible, criteria);

  if (exactFiltered.length > 0) {
    return {
      results: exactFiltered.slice(0, limit).map(toResult),
      isExact: true,
    };
  }

  // ── Relaxed fallback (drop secondary feature flags) ────────────────────────
  // Only run if we had secondary criteria worth dropping.
  const hasSecondary = criteria.seaView || criteria.pool || criteria.garden ||
    criteria.elevator || criteria.parking || criteria.furnished || criteria.heating || criteria.cooling;

  if (!hasSecondary) {
    // No secondary criteria to drop — no point running a second query.
    return { results: [], isExact: true };
  }

  const { data: relaxData, error: relaxError } = await buildQuery(admin, criteria, true);

  if (relaxError) {
    console.error("[chat/propertySearch] relaxed query error:", relaxError.message);
    return { results: [], isExact: false };
  }

  const relaxRows    = (relaxData ?? []) as PropertyRow[];
  const relaxVisible = relaxRows.filter(r => r.private_collection !== true);
  const relaxFiltered = applyPriceFilter(relaxVisible, criteria);

  return {
    results: relaxFiltered.slice(0, limit).map(toResult),
    isExact: false,
  };
}

// ── Row → ChatProperty ────────────────────────────────────────────────────────

function toResult(r: PropertyRow): ChatProperty {
  return {
    id:            r.id,
    title:         r.title,
    slug:          r.slug,
    property_code: r.property_code,
    location_text: r.location_text ?? r.location,
    size:          r.size_sqm,
    bedrooms:      r.bedrooms,
    price:         r.price_eur ?? r.price,
  };
}
