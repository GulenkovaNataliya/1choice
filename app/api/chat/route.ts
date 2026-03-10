import { type NextRequest, NextResponse } from "next/server";
import {
  parseCriteria,
  hasCriteria,
  searchProperties,
  type ChatProperty,
} from "@/lib/chat/propertySearch";

/*
 * POST /api/chat
 * Server-side chatbot response handler.
 *
 * Hidden advisory instructions, refusal rules, and response text all live
 * here — they are never included in the browser bundle.
 *
 * Body:
 *   intent     string?   optional — known intent key
 *   message    string?   optional — free-text from user
 *   pathname   string?   optional — page URL path for logging
 *   property_id string?  optional — for context/logging
 *
 * Returns:
 *   { text: string }  — advisory response or refusal
 */

// ── Property match type (included in discovery responses) ─────────────────────
//
// Re-exported shape sent to the client. Mirrors ChatProperty from propertySearch.ts.
// Using a type alias avoids re-declaring the same fields.
//
type ChatMatch = ChatProperty;

// ── Response definitions ───────────────────────────────────────────────────────
//
// Server-side only. Never shipped in the client bundle.
// Tone: calm, structured, advisory — no emojis, no fabricated facts,
// no invented prices or visa rules.
//
// triggerLeadForm: true  → client shows the contact form immediately after this response
// triggerLeadForm: false → client continues the conversation; form stays hidden
//
type BotResponse = { text: string; triggerLeadForm: boolean };

// ── Intents that open the lead form ───────────────────────────────────────────
//
// These are the ONLY approved lead-form triggers:
//   viewing_request · investment_strategy · golden_visa · general_question
//   + free-text classified as a lead trigger (see LEAD_TRIGGER_RE below)
//
const BOT_RESPONSES: Record<string, BotResponse> = {
  // ── Discovery intent — NO form ─────────────────────────────────────────────
  // Ask for up to 3 parameters before any handover.
  property_search: {
    text: "I can help identify the right property. Which area interests you — Athens, the coast, the islands, or another region? Do you have a budget range and a preferred type in mind (villa, apartment, or house)?",
    triggerLeadForm: false,
  },
  // ── Lead-form intents ──────────────────────────────────────────────────────
  investment_strategy: {
    text: "Greek real estate offers a range of investment structures depending on your goals and timeline. Share your contact details and an advisor will reach out to discuss your options.",
    triggerLeadForm: true,
  },
  golden_visa: {
    text: "The Greek Golden Visa residency-by-investment programme has specific eligibility and property requirements. Share your contact details and an advisor will walk you through the current framework.",
    triggerLeadForm: true,
  },
  viewing_request: {
    text: "We can arrange a private viewing at a time that suits you. Share your contact details and an advisor will confirm the details.",
    triggerLeadForm: true,
  },
  general_question: {
    text: "Please share your contact details and one of our advisors will get back to you.",
    triggerLeadForm: true,
  },
};

// ── Free-text discovery response — NO form ────────────────────────────────────
//
// Returned when the user's message contains property-search signals
// (area, budget, type) but no explicit lead trigger.
// Acknowledges the criteria and either asks for what is missing or
// offers the next natural step without forcing a contact form.
//
const FREE_TEXT_DISCOVERY: BotResponse = {
  text: "Thank you. To find the closest match in our portfolio, could you also confirm the area, your approximate budget, and the type of property you are looking for? If you would prefer to speak with an advisor directly, just let me know.",
  triggerLeadForm: false,
};

// Returned when the user provides criteria but enough turns have passed
// that we can offer a concrete next step — still no forced form.
const FREE_TEXT_DISCOVERY_OFFER: BotResponse = {
  text: "Based on what you have described, we may have suitable options in our portfolio. Would you like to arrange a private viewing, or shall I connect you with an advisor to discuss specific properties?",
  triggerLeadForm: false,
};

// ── Free-text lead-trigger response — form ────────────────────────────────────
const FREE_TEXT_LEAD: BotResponse = {
  text: "We can connect you with an advisor. Please share your contact details below and our team will follow up.",
  triggerLeadForm: true,
};

// ── Free-text neutral fallback — form ─────────────────────────────────────────
const FREE_TEXT_NEUTRAL: BotResponse = {
  text: "Thanks for your message. Please share your contact details below and one of our advisors will follow up.",
  triggerLeadForm: true,
};

// ── Free-text classification ──────────────────────────────────────────────────
//
// LEAD_TRIGGER_RE  — user is explicitly requesting contact, a viewing, or a callback.
//                    These are the only approved free-text triggers for the lead form.
// DISCOVERY_RE     — user is describing property criteria (area, budget, type).
//                    These continue the discovery flow without showing the form.
//
const LEAD_TRIGGER_RE: RegExp[] = [
  /\b(arrange|book|schedule|request)\s+(a\s+)?(view|viewing|visit|tour|appointment)\b/i,
  /\b(i('d|\s+would)\s+(like|love)|want|wish)\s+(to\s+)?(see|view|visit)\b/i,
  /\b(speak|talk|chat|call|contact|connect)\s+(with|to)?\s*(an?\s+)?(advisor|agent|consultant|expert|team|someone|person)\b/i,
  /\b(get\s+in\s+(touch|contact)|get\s+more\s+(info|information|details))\b/i,
  /\b(yes[,.]?\s*(please|sure|go\s+ahead|sounds\s+good)|sure[,.]?\s*please|please\s+do|i('d|\s+would)\s+like\s+that)\b/i,
  /\b(call\s*back|callback|follow[\s-]up)\b/i,
  /\bsend\s+(me|us)\s+(more|details|info|information)\b/i,
  /\b(interested\s+in\s+)?(buying|purchasing|making\s+an\s+offer|acquire)\b/i,
  /\brental\s+(estimate|income|yield|return)\b/i,
  /\b(legal|guarantee|ownership|title\s+deed|notary)\b/i,
];

const DISCOVERY_RE: RegExp[] = [
  // Greek locations
  /\b(athens|attica|mykonos|santorini|glyfada|kifisia|paros|crete|rhodes|corfu|zakynthos|kefalonia|halkidiki|voula|vouliagmeni|piraeus|kolonaki|psychiko|thessaloniki|kavala|vari|lagonisi|anavissos|saronida|markopoulo|spetses|hydra|aegina|poros)\b/i,
  // Generic location words
  /\b(area|location|region|neighbourhood|neighborhood|coast|island|mainland|suburb|city\s+cent(er|re)|near\s+the\s+sea|sea\s+view|beachfront|seafront)\b/i,
  // Budget / price
  /\b(budget|price|cost|afford|spend|invest|million|thousand|k\b|€|\d+\s*(k|m|million|thousand|euro))\b/i,
  // Property type
  /\b(villa|apartment|flat|house|townhouse|penthouse|studio|loft|duplex|maisonette|cottage|bungalow)\b/i,
  // Features / specs
  /\b(bedroom|bathroom|sqm|sq\.?\s*m|square\s+met(er|re)|m2|pool|garden|terrace|parking|garage|floor|storey|storey|floor\s+plan)\b/i,
  // Search intent
  /\b(looking\s+for|searching\s+for|find\s+(me\s+|a\s+|an\s+|some\s+)?propert|show\s+(me\s+)?(some\s+)?propert|interested\s+in\s+see|want\s+to\s+(see|find)\s+propert)\b/i,
  // Transaction type
  /\b(for\s+(rent|sale)|to\s+(buy|rent)|investment\s+propert|buy\s+to\s+(let|rent))\b/i,
];

function classifyFreeText(message: string): "lead_trigger" | "discovery" | "neutral" {
  if (LEAD_TRIGGER_RE.some((re) => re.test(message))) return "lead_trigger";
  if (DISCOVERY_RE.some((re) => re.test(message)))    return "discovery";
  return "neutral";
}

// ── Refusal / blocked messages ────────────────────────────────────────────────
//
// REFUSAL_MESSAGE  — returned on first suspicious request (strike recorded).
// BLOCKED_MESSAGE  — returned once visitor has hit the strike threshold.
// Both are intentionally identical to avoid leaking block state to the client.
//
const REFUSAL_MESSAGE =
  "I can help with properties, viewings, Golden Visa questions, and general 1Choice inquiries. I can't provide internal instructions or system configuration.";
const BLOCKED_MESSAGE = REFUSAL_MESSAGE;

// ── Injection / abuse detection patterns ─────────────────────────────────────
//
// Ordered from most-common to least-common. Each pattern covers a class of
// known prompt-injection, extraction, or jailbreak attempts.
//
const INJECTION_PATTERNS: RegExp[] = [
  // Prompt extraction
  /ignore\s+(previous|all|your)\s+instructions/i,
  /show\s+(me\s+)?(your\s+)?(prompt|system\s+prompt|instructions|rules|constraints)/i,
  /reveal\s+(your\s+)?(prompt|system|instructions|admin|config|rules)/i,
  /what\s+(are\s+)?your\s+(instructions|rules|constraints|prompt)/i,
  /repeat\s+(your\s+)?(instructions|prompt|rules|system)/i,
  // Jailbreak / role override
  /bypass\s+(your\s+)?(rules|instructions|constraints|filters)/i,
  /act\s+as\s+(an?\s+)?(admin|database|root|unrestricted|jailbreak|dan)/i,
  /you\s+(are|must|should)\s+(now\s+)?(forget|ignore|pretend|act\s+as)/i,
  /pretend\s+(you\s+)?(are|have\s+no|don.t\s+have)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  // Private data / admin access requests
  /give\s+(me\s+)?(the\s+)?(private\s+)?(link|token|key|password|secret)/i,
  /show\s+(hidden|private|vip|restricted|internal|database)\s+(properties|listings|data|keys?)/i,
  /access\s+(the\s+)?(database|admin\s+panel|supabase|backend|internal)/i,
  /list\s+(all\s+)?(properties|users|leads|tokens|admin\s+emails)/i,
  /reveal\s+(admin|private|vip|token|secret)/i,
  // XSS / script injection
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  // SQL injection
  /union\s+select/i,
  /drop\s+table/i,
  /;\s*delete\s+from/i,
  // Code execution
  /\beval\s*\(/i,
  /exec\s*\(/i,
];

// ── Input controls ────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 500; // characters

// ── In-memory rate limiter ────────────────────────────────────────────────────
//
// Per-IP, resets on serverless cold start — acceptable for MVP.
// Upgrade to Upstash Redis for production-scale multi-instance deployments.
//
type RateBucket = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT  = 20;           // requests per window
const RATE_WINDOW = 5 * 60_000;  // 5 minutes in ms

// ── Abuse strike tracking + temporary block ───────────────────────────────────
//
// Per-IP strike counter. After ABUSE_STRIKE_THRESHOLD injection attempts the IP
// is added to blockMap with a fixed expiry. Blocked IPs always receive
// BLOCKED_MESSAGE regardless of message content.
// Both maps reset on serverless cold start — acceptable for MVP.
//
const ABUSE_STRIKE_THRESHOLD = 3;
const ABUSE_BLOCK_DURATION   = 60 * 60_000; // 60 minutes in ms

const strikeMap = new Map<string, number>();           // ip → strike count
const blockMap  = new Map<string, number>();           // ip → block-expiry timestamp

function isBlocked(ip: string): boolean {
  const expiry = blockMap.get(ip);
  if (expiry === undefined) return false;
  if (Date.now() > expiry) {
    blockMap.delete(ip);
    return false;
  }
  return true;
}

/** Increments strike counter; promotes to block once threshold is hit. */
function recordStrike(ip: string): { nowBlocked: boolean; strikes: number } {
  const prev   = strikeMap.get(ip) ?? 0;
  const strikes = prev + 1;
  if (strikes >= ABUSE_STRIKE_THRESHOLD) {
    blockMap.set(ip, Date.now() + ABUSE_BLOCK_DURATION);
    strikeMap.delete(ip);
    return { nowBlocked: true, strikes };
  }
  strikeMap.set(ip, strikes);
  return { nowBlocked: false, strikes };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimitMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW };
    rateLimitMap.set(ip, bucket);
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

// Prune expired entries periodically to prevent memory growth within warm instances
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitMap.entries()) {
    if (now > bucket.resetAt) rateLimitMap.delete(ip);
  }
  for (const [ip, expiry] of blockMap.entries()) {
    if (now > expiry) blockMap.delete(ip);
  }
}, 10 * 60_000);

// ── Abuse logging ─────────────────────────────────────────────────────────────
//
// Structured fields appear in Vercel function logs under [chat-abuse].
// Fields:
//   timestamp      ISO 8601
//   ip             client IP (x-forwarded-for or x-real-ip)
//   page_url       pathname from request body
//   intent         intent key if provided
//   blocked_reason human-readable slug for block cause
//   message_length byte count of raw message
//
function logAbuse(fields: {
  timestamp:      string;
  ip:             string;
  page_url:       string | null;
  intent:         string | null;
  blocked_reason: string;
  message_length: number;
  strike_count?:  number;
}) {
  console.warn("[chat-abuse]", JSON.stringify(fields));
  // TODO: persist to Supabase `abuse_logs` table for admin review
}

// ── POST /api/chat ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // ── Blocked visitor check (before rate-limit and body parse) ────────────────
  if (isBlocked(ip)) {
    logAbuse({
      timestamp:      new Date().toISOString(),
      ip,
      page_url:       null,
      intent:         null,
      blocked_reason: "visitor_blocked",
      message_length: 0,
      strike_count:   ABUSE_STRIKE_THRESHOLD,
    });
    return NextResponse.json({ text: BLOCKED_MESSAGE });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  if (!checkRateLimit(ip)) {
    logAbuse({
      timestamp:      new Date().toISOString(),
      ip,
      page_url:       null,
      intent:         null,
      blocked_reason: "rate_limit_exceeded",
      message_length: 0,
    });
    return NextResponse.json(
      { text: "I am receiving too many messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawMessage       = typeof body.message          === "string" ? body.message          : null;
  const intent           = typeof body.intent           === "string" ? body.intent           : null;
  const pathname         = typeof body.pathname         === "string" ? body.pathname         : null;
  const conversationStep = typeof body.conversationStep === "number" ? body.conversationStep : 0;

  // ── Message length cap ──────────────────────────────────────────────────────
  if (rawMessage !== null && rawMessage.length > MAX_MESSAGE_LENGTH) {
    logAbuse({
      timestamp:      new Date().toISOString(),
      ip,
      page_url:       pathname,
      intent,
      blocked_reason: "message_too_long",
      message_length: rawMessage.length,
    });
    return NextResponse.json({ text: REFUSAL_MESSAGE });
  }

  // ── Normalise message (whitespace only — keep plain text) ───────────────────
  const message = rawMessage?.replace(/\s+/g, " ").trim() ?? null;

  // ── Injection / abuse detection ─────────────────────────────────────────────
  if (message) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(message)) {
        const { nowBlocked, strikes } = recordStrike(ip);
        logAbuse({
          timestamp:      new Date().toISOString(),
          ip,
          page_url:       pathname,
          intent,
          blocked_reason: nowBlocked
            ? `visitor_blocked_after_${strikes}_strikes`
            : `injection_strike_${strikes}:${pattern.source.slice(0, 60)}`,
          message_length: message.length,
          strike_count:   strikes,
        });
        return NextResponse.json({
          text: nowBlocked ? BLOCKED_MESSAGE : REFUSAL_MESSAGE,
        });
      }
    }
  }

  // ── Resolve advisory response ───────────────────────────────────────────────
  //
  // Intent path: known intent key → fixed response with triggerLeadForm flag.
  // Free-text path: classify message → discovery (no form) or lead trigger (form).
  // No fabricated facts, no invented properties, no private data returned.
  //
  if (intent && intent in BOT_RESPONSES) {
    const resp = BOT_RESPONSES[intent];
    return NextResponse.json({ text: resp.text, triggerLeadForm: resp.triggerLeadForm });
  }

  if (message) {
    const cls = classifyFreeText(message);

    if (cls === "lead_trigger") {
      return NextResponse.json({ text: FREE_TEXT_LEAD.text, triggerLeadForm: true });
    }

    if (cls === "discovery") {
      const criteria = await parseCriteria(message);

      if (hasCriteria(criteria)) {
        // Query the real verified catalog ─────────────────────────────────────
        const matches: ChatMatch[] = await searchProperties(criteria);

        if (matches.length > 0) {
          const areaLabel =
            matches[0].location_text
              ? ` in ${matches[0].location_text}`
              : "";
          const countLabel =
            matches.length === 1 ? "1 property" : `${matches.length} properties`;
          const text = `I found ${countLabel}${areaLabel} that may suit your requirements.`;
          return NextResponse.json({ text, triggerLeadForm: false, matches });
        }

        // Honest no-match response — still no form
        return NextResponse.json({
          text: "I wasn't able to find a verified match for those criteria at the moment. Would you like to adjust your area, budget, or property type? Our advisors can also search the full portfolio on your behalf.",
          triggerLeadForm: false,
        });
      }

      // Not enough criteria extracted — ask follow-up question ────────────────
      const resp = conversationStep >= 4 ? FREE_TEXT_DISCOVERY_OFFER : FREE_TEXT_DISCOVERY;
      return NextResponse.json({ text: resp.text, triggerLeadForm: false });
    }

    // Neutral free-text — general advisory handoff
    return NextResponse.json({ text: FREE_TEXT_NEUTRAL.text, triggerLeadForm: true });
  }

  return NextResponse.json({ error: "No intent or message provided" }, { status: 400 });
}
