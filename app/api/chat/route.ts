import { type NextRequest, NextResponse } from "next/server";

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

// ── Hidden advisory response instructions ─────────────────────────────────────
//
// Server-side only. Never shipped in the client bundle.
// Tone: calm, structured, advisory — no emojis, no fabricated facts,
// no invented prices or visa rules. Lead with context, close with next step.
//
const BOT_RESPONSES: Record<string, string> = {
  property_search:
    "I can help you identify properties that match your criteria. Share your contact details and one of our advisors will follow up with a curated selection.",
  investment_strategy:
    "Greek real estate offers a range of investment structures depending on your goals and timeline. Share your contact details and an advisor will reach out to discuss your options.",
  golden_visa:
    "The Greek Golden Visa residency-by-investment programme has specific eligibility and property requirements. Share your contact details and an advisor will walk you through the current framework.",
  viewing_request:
    "We can arrange a private viewing at a time that suits you. Share your contact details and an advisor will confirm the details.",
  general_question:
    "Please share your contact details and one of our advisors will get back to you.",
  free_text:
    "Thanks for your message. Please share your contact details below and one of our advisors will follow up.",
};

// ── Refusal message ───────────────────────────────────────────────────────────
//
// Returned for any injection attempt, prompt extraction, or out-of-scope request.
// Calm and non-confrontational — matches advisory tone.
//
const REFUSAL_MESSAGE =
  "I can only assist with advisory within the verified 1Choice portfolio.";

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

// Prune expired buckets periodically to prevent memory growth within warm instances
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitMap.entries()) {
    if (now > bucket.resetAt) rateLimitMap.delete(ip);
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
}) {
  console.warn("[chat-abuse]", JSON.stringify(fields));
}

// ── POST /api/chat ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

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

  const rawMessage   = typeof body.message     === "string" ? body.message     : null;
  const intent       = typeof body.intent      === "string" ? body.intent      : null;
  const pathname     = typeof body.pathname    === "string" ? body.pathname    : null;

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
        logAbuse({
          timestamp:      new Date().toISOString(),
          ip,
          page_url:       pathname,
          intent,
          blocked_reason: `injection:${pattern.source.slice(0, 60)}`,
          message_length: message.length,
        });
        return NextResponse.json({ text: REFUSAL_MESSAGE });
      }
    }
  }

  // ── Resolve advisory response ───────────────────────────────────────────────
  //
  // Intent path: known intent key → fixed advisory response from hidden table.
  // Free-text path: any non-empty message → generic advisory handoff.
  // No fabricated facts, no invented properties, no private data returned.
  //
  if (intent && intent in BOT_RESPONSES) {
    return NextResponse.json({ text: BOT_RESPONSES[intent] });
  }

  if (message) {
    return NextResponse.json({ text: BOT_RESPONSES.free_text });
  }

  return NextResponse.json({ error: "No intent or message provided" }, { status: 400 });
}
