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
  // ── 262.38 ─────────────────────────────────────────────────────────────────
  balcony:             boolean;
  // ── 267 ────────────────────────────────────────────────────────────────────
  veranda:             boolean;
  private_roof_terrace: boolean;
  close_to_beaches:    boolean;
  panoramic_view:      boolean;
  mountain_view:       boolean;
  acropolis_view:      boolean;
  loft:                boolean;
  internal_staircase:  boolean;
  jacuzzi:             boolean;
  barbeque:            boolean;
};

// ── Dynamic location map ───────────────────────────────────────────────────────
//
// Builds a flat list of [keyword, slug] pairs for every active location.
// Each location row contributes up to 3 entries: name, name_he, name_ar.
// Sorted longest-first so "vouliagmeni" beats "voula" on partial overlap.

type LocationRow = { name: string; slug: string; name_he: string | null; name_ar: string | null };
let _locationMapCache: [string, string][] | null = null;

async function getLocationMap(): Promise<[string, string][]> {
  if (_locationMapCache) return _locationMapCache;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select("name,slug,name_he,name_ar")
    .eq("is_active", true);
  if (error || !data) {
    console.error("[chat/propertySearch] location map fetch error:", error?.message);
    return [];
  }
  const entries: [string, string][] = [];
  for (const r of data as LocationRow[]) {
    entries.push([r.name.toLowerCase(), r.slug]);
    if (r.name_he) entries.push([r.name_he.toLowerCase(), r.slug]);
    if (r.name_ar) entries.push([r.name_ar.toLowerCase(), r.slug]);
  }
  const map = entries.sort((a, b) => b[0].length - a[0].length);
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
  const s = suffix.toLowerCase().trim();
  let val = raw;
  if (s === "m" || s === "million" || s === "млн" || s === "εκ" || s === "מיליון" || s === "مليون") val = raw * 1_000_000;
  else if (s === "k" || s === "thousand" || s === "тыс" || s === "χιλ" || s === "χ" || s === "אלף" || s === "ألف") val = raw * 1_000;
  return val >= 50_000 ? val : null;
}

function extractMaxPrice(message: string): number | null {
  const re =
    /€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(k|m|million|thousand|тыс|млн|εκ|χιλ|χ|מיליון|אלף|مليون|ألف)?(?!\s*(?:bed|bath|floor|storey|room|sqm|sq|m²|m2|кв|τ\.μ|מ[״']\s*ר|מטר|متر))/gi;
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
  // Hebrew:  "מ-N", "ממחיר N", "לפחות N"
  // Arabic:  "من N", "ابتداء من N", "على الأقل N"
  const patterns = [
    /(?:from|starting\s+at|above|over|minimum|at\s+least|budget\s+above|no\s+less\s+than)\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(k|m|million|thousand)?/i,
    /\bот\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(тыс|млн|k|m)?/i,
    /\bαπό\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)\s*(χιλ|εκ|k|m)?/i,
    /(?:מ-|ממחיר|לפחות)\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)/,
    /(?:من|ابتداء\s+من|على\s+الأقل)\s*€?\$?\s*([\d][\d\s,_]*(?:\.\d+)?)/,
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
// HE: "2 חדרי שינה", "2 חדרים"
// AR: "2 غرفة نوم", "2 غرف"

function extractBedrooms(message: string): number | null {
  const m =
    message.match(/(\d)\s*\+?\s*(?:bed(?:room)?s?|br\b)/i) ??
    message.match(/(\d)\s*(?:спальн|комнат)/i) ??
    message.match(/(\d)\s*(?:υπνοδωμ)/i) ??    // stem covers: -άτιο (sg), -άτια (pl nom), -ατίων (gen pl)
    message.match(/(\d)\s*(?:חדרי\s+שינה|חדרים|חדר)/) ??
    message.match(/(\d)\s*(?:غرف(?:ة)?\s+نوم|غرف(?:ة)?)/);
  return m ? parseInt(m[1], 10) : null;
}

// ── Bathroom extraction ───────────────────────────────────────────────────────
// EN: "2 bathrooms", "2 baths"
// RU: "2 ванных", "2 ванные"
// EL: "2 μπάνια"
// HE: "2 חדרי אמבטיה", "2 שירותים"
// AR: "2 حمام", "2 حمامات"

function extractBathrooms(message: string): number | null {
  const m =
    message.match(/(\d)\s*\+?\s*(?:bath(?:room)?s?|wc\b)/i) ??
    message.match(/(\d)\s*(?:ванн)/i) ??
    message.match(/(\d)\s*(?:μπάνι)/i) ??
    message.match(/(\d)\s*(?:חדרי\s+אמבטיה|שירותים)/) ??
    message.match(/(\d)\s*(?:حمامات?)/);
  return m ? parseInt(m[1], 10) : null;
}

// ── Size extraction ────────────────────────────────────────────────────────────
// EN: "50 sqm", "50 m²", "50 sq.m"
// RU: "50 кв.м", "50 кв м", "50 квадратных метров"
// EL: "50 τ.μ.", "50 τετραγωνικά"
// HE: "50 מ״ר", "50 מטר רבוע", "50 מ'ר"
// AR: "50 متر", "50 م²", "50 متر مربع"

function extractSize(message: string): { minSize: number | null; maxSize: number | null } {
  const lower = message.toLowerCase();

  // Size unit — EN + RU + EL + HE + AR
  const unitRe = /sqm|sq\.?\s*m\b|m²|m2|square\s*met|кв\.?\s*м|квадратных|τ\.?\s*μ\.?|τετραγωνικ|מ[״']\s*ר|מטר\s*רבוע|متر\s*مربع|م²/i;
  // Size unit alternatives for patterns below
  const unitAlt = /sqm|sq|m²|m2|square|кв|τ\.?μ|מ[״']\s*ר|מטר|متر|م²/;

  // Explicit range
  const rangeM =
    lower.match(/between\s+(\d+)\s+and\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ)/) ??
    lower.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ|מ[״']\s*ר|מטר|متر|م²)/);
  if (rangeM) {
    const a = parseInt(rangeM[1], 10);
    const b = parseInt(rangeM[2], 10);
    if (!isNaN(a) && !isNaN(b)) return { minSize: Math.min(a, b), maxSize: Math.max(a, b) };
  }

  // Upper bound
  const upperM = message.match(
    /(?:under|max(?:imum)?|up\s+to|less\s+than|до|עד|حتى)\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ|מ[״']\s*ר|מטר|متر|م²)/i
  );
  if (upperM) {
    const v = parseInt(upperM[1], 10);
    if (!isNaN(v)) return { minSize: null, maxSize: v };
  }

  // Lower bound
  const lowerM = message.match(
    /(?:at\s+least|min(?:imum)?|more\s+than|over|от|από|לפחות|على\s+الأقل)\s+(\d+)\s*(?:sqm|sq|m²|m2|square|кв|τ\.?μ|מ[״']\s*ר|מטר|متر|م²)/i
  );
  if (lowerM) {
    const v = parseInt(lowerM[1], 10);
    if (!isNaN(v)) return { minSize: v, maxSize: null };
  }

  // Bare target "N sqm/кв.м/τ.μ./מ״ר/متر" → ±30% band
  if (unitRe.test(message)) {
    const m = message.match(
      /(\d{2,4})\s*(?:sqm|sq\.?\s*m\b|m²|m2|square|кв\.?\s*м|квадратных|τ\.?\s*μ\.?|τετραγωνικ|מ[״']\s*ר|מטר\s*רבוע|מטר|متر\s*مربع|م²|متر)/i
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
  // \b only on ASCII tokens; non-ASCII alternatives are plain substring matches
  // HE: קרקע/מגרש (land), מסחרי/משרד/חנות (commercial), מלון (hotel)
  // AR: أرض/قطعة أرض (land), تجاري/مكتب/محل (commercial), فندق (hotel)
  if (/\b(?:land|plot)\b|οικόπεδ|земл[яюе]|участок|קרקע|מגרש|أرض|قطعة\s+أرض/i.test(message)) return "land";
  if (/\b(?:commercial|office|shop|retail)\b|εμπορικ|коммерческ|מסחרי|משרד|חנות|تجاري|مكتب|محل/i.test(message)) return "commercial";
  if (/\b(?:hotel|hospitality)\b|ξενοδοχ|гостиниц|отель|מלון|فندق/i.test(message)) return "hotel";
  return null;
}

// ── Subtype extraction (residential only) ────────────────────────────────────
// EN + RU + EL equivalents.
// land/commercial handled by category — not listed here.

// NOTE: \b is only used for pure ASCII tokens (EN).
// Cyrillic, Greek, Hebrew, Arabic characters are \W in JS regex — \b before/after them
// would require an adjacent ASCII \w char, which never happens in pure non-ASCII text.
// All non-ASCII alternatives use plain substring matching (no \b).
const SUBTYPE_KEYWORDS: [RegExp, string][] = [
  // studio: EN + RU + EL + HE (סטודיו) + AR (ستوديو/استوديو)
  [/\bstudio\b|студия|στούντιο|סטודיו|ستوديو|استوديو/i,                 "studio"],
  // apartment: EN + RU (квартира) + EL (διαμέρισμα) + HE (דירה/שקה) + AR (شقة)
  [/\bapartment\b|\bapartements?\b|квартир[ауы]?|διαμέρισμ|דירה|שקה|شقة/i,   "apartment"],
  // maisonette: EN + RU + EL + HE (מאיסונט/דופלקס) + AR (ميزونيت/دوبلكس)
  [/\bmaisonette\b|\bduplex\b|мезонет|таунхаус|μεζονέτ|מאיסונט|דופלקס|ميزونيت|دوبلكس/i, "maisonette"],
  // villa: EN + RU + EL + HE (וילה) + AR (فيلا)
  [/\bvilla\b|вилл[аы]|βίλ[αε]?|וילה|فيلا/i,                                "villa"],
  // house: EN + RU + EL + HE (בית) + AR (منزل/بيت)
  [/\bhouse\b|\bdetached\b|дом|κατοικί|μονοκατοικί|בית|منزل|بيت/i,    "house"],
  // penthouse: EN + RU + HE (פנטהאוס) + AR (بنتهاوس)
  [/\bpenthouse\b|пентхаус|פנטהאוס|بنتهاوس/i,                                  "penthouse"],
  // loft: EN + RU + AR (لوفت)
  [/\bloft\b|лофт|لوفت/i,                                                       "loft"],
];

function extractSubtype(message: string): string | null {
  for (const [re, value] of SUBTYPE_KEYWORDS) {
    if (re.test(message)) return value;
  }
  return null;
}

// ── Sea view extraction ───────────────────────────────────────────────────────
// EN: sea view, seaview, with sea, ocean view
// RU: вид на море / с видом на море / морской вид (instrumental case fixed)
// EL: θέα θάλασσα / θέα στη θάλασσα / θέα στο Αιγαίο (preposition between words)
// HE: נוף לים
// AR: إطلالة على البحر

function extractSeaView(message: string): boolean {
  // \b only used for ASCII tokens; no \b before/after Cyrillic or Greek (non-ASCII = \W in JS regex)
  return /\bsea[-\s]?view\b|\bseaview\b|\bwith\s+sea\b|\bocean\s+view\b|вид(?:ом)?\s+на\s+море|морской\s+вид|с\s+видом\s+на\s+море|θέα\s+(?:στη?[νν]?\s+)?θάλασσ|θαλασσ[αίο]+\s*θέα|נוף\s+לים|إطلالة\s+(?:على\s+)?البحر/i.test(message);
}

// ── Transaction type extraction ───────────────────────────────────────────────
// EN + RU + EL + HE (למכירה / להשכרה) + AR (للبيع / للإيجار)
//
// Order: antiparochi must be checked FIRST (it is a subtype of sale in some contexts).
//
// antiparochi:
//   EN: antiparochi
//   EL: αντιπαροχ (covers αντιπαροχή, αντιπαροχής, etc.)
//   RU: антипарохи (transliteration — users of this term likely know the Greek word)
//
// sale:
//   EN: for sale, to buy, purchase, buying, buy
//   RU: покупк / купить / продаётся / продаж / на продажу
//   EL: αγορ(ά) / προς πώλη / πώλησ / πωλείται ("is for sale" — common passive form)
//   HE: למכירה
//   AR: للبيع
//
// rent:
//   EN: for rent, to rent, rental, renting, rent
//   RU: аренд / снять / сдаётся ("is for rent" — common passive form)
//   EL: ενοικί / ενοίκιο (rent as noun) / μισθών(εται) / προς ενοικί
//   HE: להשכרה / שכירות (rental noun)
//   AR: للإيجار

function extractTransactionType(message: string): "sale" | "rent" | "antiparochi" | null {
  // HE אנטיפרוכי / AR أنتيباروخي — phonetic transliterations users would type
  if (/\bantiparochi\b|αντιπαροχ|антипарохи|אנטיפרוכי|أنتيباروخي/i.test(message)) return "antiparochi";
  if (/\bfor\s+sale\b|\bto\s+buy\b|\bpurchase\b|\bbuying\b|\bbuy\b|покупк|купить|продаётся|продаж|на\s+продажу|αγορ[αά]|προς\s+πώλη|πώλησ|πωλείται|למכירה|للبيع/i.test(message)) return "sale";
  if (/\bfor\s+rent\b|\bto\s+rent\b|\brental\b|\brenting\b|\brent\b|аренд|снять|сдаётся|ενοικί|ενοίκιο|μισθών|προς\s+ενοικί|להשכרה|שכירות|للإيجار/i.test(message)) return "rent";
  return null;
}

// ── Furnished extraction ──────────────────────────────────────────────────────
// EN + RU (меблированная, с мебелью) + EL (επιπλωμένο)
// HE: מרוהט (furnished), ריהוט מלא (fully furnished), לא מרוהט (unfurnished)
// AR: مفروش (furnished), مفروش بالكامل (fully), غير مفروش (unfurnished)

function extractFurnished(message: string): "any" | "fully" | null {
  if (/\bnot\s+furnished\b|\bunfurnished\b|немеблированн|χωρίς\s+έπιπλ|לא\s+מרוהט|غير\s+مفروش/i.test(message)) return null;
  if (/\bfully\s+furnished\b|\bfull\s+furnished\b|полностью\s+меблир|πλήρως\s+επιπλωμέν|ריהוט\s+מלא|מרוהט\s+במלואו|مفروش\s+بالكامل/i.test(message)) return "fully";
  if (/\bfurnished\b|меблир|с\s+мебелью|επιπλωμέν|מרוהט|مفروش/i.test(message)) return "any";
  return null;
}

// ── Heating / cooling extraction ──────────────────────────────────────────────
// EN + RU + EL + HE (חימום / מיזוג) + AR (تدفئة / تكييف)

function extractHeating(message: string): boolean {
  return /\bheating\b|\bcentral\s+heat|\bheat\s+pump\b|\bunderfloor\s+heat|\bwith\s+heat|отопление|отопл|θέρμανσ|חימום|تدفئة/i.test(message);
}

function extractCooling(message: string): boolean {
  return /\bcooling\b|\bair[-\s]?con(?:ditioning)?\b|\ba\/c\b|\bac\b|\bsplit\s+unit|\bclimate\s+control|кондиционер|κλιματισμ|מיזוג|تكييف/i.test(message);
}

// ── Boolean amenities ────────────────────────────────────────────────────────
// EN + RU + EL + HE + AR

function extractPool(message: string): boolean {
  // HE: בריכה (pool)  |  AR: مسبح (pool)
  return /\bpool\b|\bswimming\b|бассейн|πισίν|בריכה|مسبح/i.test(message);
}

function extractGarden(message: string): boolean {
  // HE: גינה (garden)  |  AR: حديقة (garden)
  return /\bgarden\b|\byard\b|\boutdoor\s+space|сад|κήπ|גינה|حديقة/i.test(message);
}

function extractElevator(message: string): boolean {
  // HE: מעלית (elevator)  |  AR: مصعد (elevator)
  return /\belevator\b|\blift\b|\bwith\s+lift\b|\bwith\s+elevator\b|лифт|ασανσέρ|מעלית|مصعد/i.test(message);
}

// ── Balcony / terrace / awnings extraction ────────────────────────────────────
// EN + RU + EL + HE + AR

function extractBalcony(message: string): boolean {
  // EN: balcony | RU: балкон (covers -ом, -а) | EL: μπαλκόν (covers -ι, -ια) | HE: מרפסת | AR: شرفة
  return /\bbalcon(?:y|ies)\b|балкон|μπαλκόν|מרפסת|شرفة/i.test(message);
}

function extractVeranda(message: string): boolean {
  // EN: veranda, verandah, terrace | RU: веранда, терраса | EL: βεράντα, βεράντ, ταράτσα | HE: ורנדה, מרפסת מקורה | AR: فيراندا, شرفة مغطاة
  return /\bveranda[h]?\b|\bterrace[s]?\b|веранд|террас|βεράντ[αες]?|ταράτσ[αες]|ורנדה|מרפסת\s+מקורה|فيراندا|شرفة\s+مغطاة/i.test(message);
}

function extractPrivateRoofTerrace(message: string): boolean {
  // EN: roof terrace, rooftop terrace, private terrace | RU: терраса на крыше, частная терраса | EL: ταράτσα | HE: גג פרטי, טרסה פרטית | AR: تراس سطح, تراس خاص
  return /\broof\s+terrace\b|\brooftop\s+terrace\b|\bprivate\s+(?:roof\s+)?terrace\b|терраса\s+на\s+крыше|частная\s+терраса|ταράτσ[αες]|גג\s+פרטי|טרסה\s+פרטית|تراس\s+(?:سطح|خاص)/i.test(message);
}

function extractCloseToBeaches(message: string): boolean {
  // EN: close to beach, near beach, beach access | RU: рядом с пляжем, у моря | EL: κοντά σε παραλί, κοντά στη θάλασσα | HE: קרוב לחוף, ליד הים | AR: قريب من الشاطئ, بالقرب من البحر
  return /\bclose\s+to\s+(?:the\s+)?beach|\bnear\s+(?:the\s+)?beach|\bbeach\s+access|\bbeachfront\b|рядом\s+с\s+пляж|у\s+моря|κοντά\s+(?:σε\s+παραλ|στη\s+θάλασσ)|קרוב\s+לחוף|ליד\s+הים|قريب\s+من\s+الشاطئ|بالقرب\s+من\s+البحر/i.test(message);
}

function extractPanoramicView(message: string): boolean {
  // EN: panoramic view, panoramic | RU: панорамный вид, панорама | EL: πανοραμική θέα, πανόραμα | HE: נוף פנורמי, פנורמה | AR: إطلالة بانورامية, بانوراما
  return /\bpanoramic\b|панорам|πανοραμικ|πανόραμ|נוף\s+פנורמ|פנורמה|إطلالة\s+بانوراميّة|بانوراما/i.test(message);
}

function extractMountainView(message: string): boolean {
  // EN: mountain view | RU: вид на горы | EL: θέα βουνό, ορεινή θέα | HE: נוף להרים | AR: إطلالة على الجبال
  return /\bmountain\s+view\b|\bwith\s+mountain\b|вид\s+на\s+гор|горный\s+вид|θέα\s+(?:στο\s+)?βουν|ορεινή\s+θέα|נוף\s+להרים|إطلالة\s+(?:على\s+)?الجبال/i.test(message);
}

function extractAcropolisView(message: string): boolean {
  // EN: acropolis view, acropolis | RU: вид на акрополь | EL: θέα Ακρόπολη | HE: נוף לאקרופוליס | AR: إطلالة على الأكروبوليس
  return /\bacropolis\b|акрополь|Ακρόπολ|אקרופוליס|الأكروبوليس/i.test(message);
}

function extractLoft(message: string): boolean {
  // EN: loft | RU: лофт | EL: λοφτ | HE: לופט | AR: لوفت
  return /\bloft\b|лофт|λοφτ|לופט|لوفت/i.test(message);
}

function extractInternalStaircase(message: string): boolean {
  // EN: internal staircase, internal stairs, private staircase | RU: внутренняя лестница | EL: εσωτερική σκάλα | HE: גרם מדרגות פנימי | AR: درج داخلي
  return /\binternal\s+staircase\b|\binternal\s+stairs\b|\bprivate\s+staircase\b|внутренняя\s+лестниц|εσωτερική\s+σκάλ|גרם\s+מדרגות\s+פנימי|درج\s+داخلي/i.test(message);
}

function extractJacuzzi(message: string): boolean {
  // EN: jacuzzi, hot tub, whirlpool | RU: джакузи | EL: τζακούζι | HE: ג'קוזי | AR: جاكوزي
  return /\bjacuzzi\b|\bhot\s+tub\b|\bwhirlpool\b|джакузи|τζακούζι|ג'קוזי|جاكوزي/i.test(message);
}

function extractBarbeque(message: string): boolean {
  // EN: barbeque, bbq, barbecue, grill | RU: барбекю, гриль | EL: μπάρμπεκιου, ψησταριά | HE: מנגל, גריל | AR: شواء, باربيكيو
  return /\bbarb(?:e)?que\b|\bbbq\b|\bgrill\b|барбекю|гриль|μπάρμπεκιου|ψησταρι[αά]|מנגל|גריל|شواء|باربيكيو/i.test(message);
}

// ── Parking extraction ────────────────────────────────────────────────────────
// EN: "parking", "garage", "with parking", "parking space"
// RU: "парковка", "с парковкой", "гараж"
// EL: "στάθμευση", "πάρκινγκ"
// HE: "חניה" (parking)
// AR: "موقف" (parking), "جراج" (garage)

function extractParking(message: string): boolean {
  return /\bparking\b|\bgarage\b|\bparking\s+space\b|парковк|гараж|σταθμευσ|πάρκινγκ|חניה|موقف|جراج/i.test(message);
}

// ── Golden Visa ───────────────────────────────────────────────────────────────
// HE: ויזת זהב  |  AR: تأشيرة ذهبية

function extractGoldenVisa(message: string): boolean {
  // RU: золотая виза (nom) / золотой визы (gen)  |  HE: ויזת זהב / ויזת הזהב  |  AR: تأشيرة ذهبية / التأشيرة الذهبية
  return /golden\s*visa|золотой?\s+виз[аы]|χρυσή\s+βίζα|ויזת\s+(?:ה)?זהב|(?:ال)?تأشيرة\s+(?:ال)?ذهبية/i.test(message);
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
    category:             extractCategory(message),
    parking:              extractParking(message),
    balcony:              extractBalcony(message),
    veranda:              extractVeranda(message),
    private_roof_terrace: extractPrivateRoofTerrace(message),
    close_to_beaches:     extractCloseToBeaches(message),
    panoramic_view:       extractPanoramicView(message),
    mountain_view:        extractMountainView(message),
    acropolis_view:       extractAcropolisView(message),
    loft:                 extractLoft(message),
    internal_staircase:   extractInternalStaircase(message),
    jacuzzi:              extractJacuzzi(message),
    barbeque:             extractBarbeque(message),
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
    criteria.parking              ||
    criteria.balcony              ||
    criteria.veranda              ||
    criteria.private_roof_terrace ||
    criteria.close_to_beaches     ||
    criteria.panoramic_view       ||
    criteria.mountain_view        ||
    criteria.acropolis_view       ||
    criteria.loft                 ||
    criteria.internal_staircase   ||
    criteria.jacuzzi              ||
    criteria.barbeque             ||
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
    if (criteria.parking)              q = q.eq("parking",               true);
    if (criteria.balcony)              q = q.eq("balcony",               true);
    if (criteria.veranda)              q = q.eq("veranda",               true);
    if (criteria.private_roof_terrace) q = q.eq("private_roof_terrace",  true);
    if (criteria.close_to_beaches)     q = q.eq("close_to_beaches",      true);
    if (criteria.panoramic_view)       q = q.eq("panoramic_view",        true);
    if (criteria.mountain_view)        q = q.eq("mountain_view",         true);
    if (criteria.acropolis_view)       q = q.eq("acropolis_view",        true);
    if (criteria.loft)                 q = q.eq("loft",                  true);
    if (criteria.internal_staircase)   q = q.eq("internal_staircase",    true);
    if (criteria.jacuzzi)              q = q.eq("jacuzzi",               true);
    if (criteria.barbeque)             q = q.eq("barbeque",              true);
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
    criteria.elevator || criteria.parking || criteria.furnished || criteria.heating || criteria.cooling ||
    criteria.balcony || criteria.veranda || criteria.private_roof_terrace ||
    criteria.close_to_beaches || criteria.panoramic_view || criteria.mountain_view ||
    criteria.acropolis_view || criteria.loft ||
    criteria.internal_staircase || criteria.jacuzzi || criteria.barbeque;

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
