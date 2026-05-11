import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  parseCriteria,
  hasCriteria,
  searchProperties,
  type ChatProperty,
  type SearchResult,
} from "@/lib/chat/propertySearch";
import { getAiClient } from "@/lib/chat/aiClient";
import { detectLang, getFormStrings } from "@/lib/chat/chatI18n";
import { buildSystemPrompt } from "@/lib/chat/systemPrompt";
import { sendChatAlertNotification } from "@/lib/telegram/sendChatAlertNotification";

/*
 * POST /api/chat
 * AI-powered multilingual advisory chat.
 *
 * Safety checks (rate limit, abuse, injection) run BEFORE the AI call.
 * Property search runs in parallel / before AI to enrich the context.
 * AI returns structured JSON: { replyText, triggerLeadForm }.
 * Lead form trigger flag is fully controlled by the AI.
 *
 * Body:
 *   message         string?   free-text from user
 *   intent          string?   quick-action intent key
 *   pathname        string?   current page path
 *   conversationStep number?  turn counter
 *   sttLang         string?   voice/UI language code (e.g. "ru-RU", "el-GR")
 *   chatHistory     {role:"user"|"assistant"; text:string}[]?  prior turns
 *   propertyTitle   string?   current property (if on detail page)
 *   propertyCode    string?   current property code
 *   propertyLocation string?  current property area
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatMatch = ChatProperty;

// ── Model ─────────────────────────────────────────────────────────────────────
// Haiku 4.5 — fast, cost-effective, sufficient for real-time advisory chat.
// Switch to claude-opus-4-6 for higher reasoning depth if needed.
const AI_MODEL = "claude-haiku-4-5-20251001";
const AI_TIMEOUT_MS = 10_000;

// ── Intent label map (for quick-action context) ───────────────────────────────
const INTENT_LABELS: Record<string, string> = {
  property_search:    "I want to explore and search for properties",
  investment_strategy:"I want to discuss real estate investment strategy in Greece",
  golden_visa:        "I want to learn about the Greek Golden Visa programme",
  viewing_request:    "I want to arrange a private property viewing",
  general_question:   "I have a general question about 1Choice",
  property_viewing:   "I want to arrange a viewing for this property",
  property_inquiry:   "I have a question about this property",
};

// ── Fallback responses (used when AI is unavailable) ──────────────────────────
//
// Keyed by ChatLang. Returned when the AI call fails or times out.
// triggerLeadForm: true ensures lead capture still works even on failure.
//
const FALLBACK_REPLIES: Record<string, { text: string; triggerLeadForm: boolean }> = {
  en: {
    text: "I am currently unable to respond. Please share your contact details below and an advisor will follow up.",
    triggerLeadForm: true,
  },
  ru: {
    text: "В данный момент я не могу ответить. Оставьте свои контактные данные ниже, и консультант свяжется с вами.",
    triggerLeadForm: true,
  },
  el: {
    text: "Αυτή τη στιγμή δεν μπορώ να απαντήσω. Αφήστε τα στοιχεία επικοινωνίας σας και ένας σύμβουλος θα επικοινωνήσει μαζί σας.",
    triggerLeadForm: true,
  },
  ar: {
    text: "لا أستطيع الرد في الوقت الحالي. يرجى مشاركة بيانات الاتصال الخاصة بك أدناه وسيتواصل معك مستشار.",
    triggerLeadForm: true,
  },
  he: {
    text: "כרגע אינני יכול/ה להשיב. אנא השאר/י את פרטי הקשר שלך למטה ומייעץ יחזור אליך.",
    triggerLeadForm: true,
  },
};

function getFallback(lang: string) {
  return FALLBACK_REPLIES[lang] ?? FALLBACK_REPLIES.en;
}

// ── Localized rate-limit / refusal messages ───────────────────────────────────
function getRateLimitMsg(lang: string): string {
  return getFormStrings(detectLang(lang)).rateLimitMsg;
}

function getRefusalMsg(lang: string): string {
  return getFormStrings(detectLang(lang)).refusalMsg;
}

// ── Injection / abuse detection ───────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|your)\s+instructions/i,
  /show\s+(me\s+)?(your\s+)?(prompt|system\s+prompt|instructions|rules|constraints)/i,
  /reveal\s+(your\s+)?(prompt|system|instructions|admin|config|rules)/i,
  /what\s+(are\s+)?your\s+(instructions|rules|constraints|prompt)/i,
  /repeat\s+(your\s+)?(instructions|prompt|rules|system)/i,
  /bypass\s+(your\s+)?(rules|instructions|constraints|filters)/i,
  /act\s+as\s+(an?\s+)?(admin|database|root|unrestricted|jailbreak|dan)/i,
  /you\s+(are|must|should)\s+(now\s+)?(forget|ignore|pretend|act\s+as)/i,
  /pretend\s+(you\s+)?(are|have\s+no|don.t\s+have)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /give\s+(me\s+)?(the\s+)?(private\s+)?(link|token|key|password|secret)/i,
  /show\s+(hidden|private|restricted|internal|database)\s+(properties|listings|data|keys?)/i,
  /access\s+(the\s+)?(database|admin\s+panel|supabase|backend|internal)/i,
  /list\s+(all\s+)?(properties|users|leads|tokens|admin\s+emails)/i,
  /reveal\s+(admin|private|token|secret)/i,
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  /union\s+select/i,
  /drop\s+table/i,
  /;\s*delete\s+from/i,
  /\beval\s*\(/i,
  /exec\s*\(/i,
];

// ── Input controls ─────────────────────────────────────────────────────────────

const MIN_MESSAGE_LENGTH = 2;
const MAX_MESSAGE_LENGTH = 1000;

// ── In-memory rate limiter ────────────────────────────────────────────────────

type RateBucket = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT  = 20;
const RATE_WINDOW = 60_000;  // 1-minute window

const ABUSE_STRIKE_THRESHOLD = 3;
const ABUSE_BLOCK_DURATION   = 60 * 60_000;

// ── Chat-alert anti-spam ──────────────────────────────────────────────────────
// One alert per IP per CHAT_ALERT_COOLDOWN_MS. Prevents Telegram spam when
// a user sends multiple high-intent messages in the same session.

const CHAT_ALERT_COOLDOWN_MS = 20 * 60_000; // 20 minutes
const chatAlertCooldownMap   = new Map<string, number>(); // ip → lastAlertAt

function canSendChatAlert(ip: string): boolean {
  const last = chatAlertCooldownMap.get(ip);
  if (last === undefined) return true;
  return Date.now() - last > CHAT_ALERT_COOLDOWN_MS;
}

function recordChatAlert(ip: string): void {
  chatAlertCooldownMap.set(ip, Date.now());
}

// ── High-intent signal detection ──────────────────────────────────────────────

const VIEWING_RE = /\b(viewing|schedule\s+a\s+visit|want\s+to\s+(see|visit)|can\s+i\s+see|arrange\s+(a\s+)?viewing|book\s+(a\s+)?viewing|come\s+and\s+see|private\s+showing)\b/i;
const CONTACT_RE = /\b(call\s+me|contact\s+me|speak\s+with\s+(someone|an?\s+advisor)|advisor|consultation|someone\s+call|get\s+in\s+touch|reach\s+out|want\s+to\s+talk)\b/i;
const PHONE_RE   = /(?<!\d)(\+\d{7,15}|\b\d{3}[\s.\-]\d{3,4}[\s.\-]\d{4})\b/;
const EMAIL_RE   = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const HINTKEY_RE = /\b(interested\s+in\s+(this|the)\s+property|ready\s+to\s+buy|want\s+more\s+details?\s+(now|today)|serious(ly)?\s+interested|next\s+steps?|how\s+(do\s+i|can\s+i)\s+(proceed|start|buy|purchase)|i('?ll?\s+take|want\s+to\s+buy))\b/i;

const HIGH_INTENT_QUICK_ACTIONS = new Set([
  "viewing_request",
  "contact_advisor",
  "property_viewing",
]);

function detectContactInMessage(message: string): boolean {
  return PHONE_RE.test(message) || EMAIL_RE.test(message);
}

function isHighIntentSignal(opts: {
  triggerLeadForm: boolean;
  intent:          string | null;
  message:         string | null;
}): { isHigh: boolean; reason: string } {
  if (opts.triggerLeadForm) {
    return { isHigh: true, reason: "trigger_lead_form" };
  }
  if (opts.intent && HIGH_INTENT_QUICK_ACTIONS.has(opts.intent)) {
    return { isHigh: true, reason: "intent_action" };
  }
  if (!opts.message) return { isHigh: false, reason: "no_signal" };

  if (PHONE_RE.test(opts.message))   return { isHigh: true, reason: "phone_in_message" };
  if (EMAIL_RE.test(opts.message))   return { isHigh: true, reason: "email_in_message" };
  if (VIEWING_RE.test(opts.message)) return { isHigh: true, reason: "viewing_signal" };
  if (CONTACT_RE.test(opts.message)) return { isHigh: true, reason: "contact_signal" };
  if (HINTKEY_RE.test(opts.message)) return { isHigh: true, reason: "high_intent_keywords" };

  return { isHigh: false, reason: "no_signal" };
}

const strikeMap = new Map<string, number>();
const blockMap  = new Map<string, number>();

function isBlocked(ip: string): boolean {
  const expiry = blockMap.get(ip);
  if (expiry === undefined) return false;
  if (Date.now() > expiry) { blockMap.delete(ip); return false; }
  return true;
}

function recordStrike(ip: string): { nowBlocked: boolean; strikes: number } {
  const prev    = strikeMap.get(ip) ?? 0;
  const strikes = prev + 1;
  if (strikes >= ABUSE_STRIKE_THRESHOLD) {
    blockMap.set(ip, Date.now() + ABUSE_BLOCK_DURATION);
    strikeMap.delete(ip);
    return { nowBlocked: true, strikes };
  }
  strikeMap.set(ip, strikes);
  return { nowBlocked: false, strikes };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function getAdminBaseUrl(): string | null {
  const raw =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    null;
  const base = raw?.trim().replace(/\/+$/, "") ?? "";

  if (!base) {
    console.warn("[chat-alert] SITE_URL is not configured; admin link will be omitted");
    return null;
  }

  return base;
}

function buildLeadsDashboardUrl(): string | null {
  const base = getAdminBaseUrl();
  return base ? `${base}/admin/leads` : null;
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

setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitMap.entries()) {
    if (now > bucket.resetAt) rateLimitMap.delete(ip);
  }
  for (const [ip, expiry] of blockMap.entries()) {
    if (now > expiry) blockMap.delete(ip);
  }
}, 10 * 60_000);

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
}

// ── AI call ───────────────────────────────────────────────────────────────────

type AiReply = {
  replyText:       string;
  triggerLeadForm: boolean;
  usage:           { input_tokens: number; output_tokens: number };
};

async function callAi(opts: {
  systemPrompt:  string;
  messages:      Anthropic.MessageParam[];
}): Promise<AiReply | null> {
  try {
    const client = getAiClient();

    const response = await Promise.race([
      client.messages.create({
        model:       AI_MODEL,
        max_tokens:  600,
        system:      opts.systemPrompt,
        messages:    opts.messages,
        tools: [
          {
            name:        "respond",
            description: "Reply to the user with structured advisory response",
            input_schema: {
              type:       "object" as const,
              properties: {
                replyText:       { type: "string" as const, description: "The response text shown to the user" },
                triggerLeadForm: { type: "boolean" as const, description: "Whether to show the lead contact form" },
              },
              required:             ["replyText", "triggerLeadForm"],
              additionalProperties: false,
            },
          },
        ],
        tool_choice: { type: "tool" as const, name: "respond" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), AI_TIMEOUT_MS)
      ),
    ]);

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolBlock) return null;

    const input = toolBlock.input as { replyText?: unknown; triggerLeadForm?: unknown };
    if (typeof input.replyText !== "string") return null;

    return {
      replyText:       input.replyText,
      triggerLeadForm: input.triggerLeadForm === true,
      usage:           { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens },
    };
  } catch (err) {
    // Log enough context to diagnose: missing API key → 401, quota → 429, timeout → message
    const isObj = err !== null && typeof err === "object";
    console.error("[chat-ai] error:", JSON.stringify({
      message: isObj && "message" in err ? (err as { message: unknown }).message : String(err),
      status:  isObj && "status"  in err ? (err as { status:  unknown }).status  : undefined,
      type:    isObj && "error"   in err && err.error !== null && typeof err.error === "object" && "type" in (err.error as object)
               ? (err as { error: { type: unknown } }).error.type : undefined,
    }));
    return null;
  }
}

// ── POST /api/chat ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip  = getClientIp(request);

  // ── Blocked visitor ───────────────────────────────────────────────────────
  if (isBlocked(ip)) {
    logAbuse({ timestamp: new Date().toISOString(), ip, page_url: null, intent: null, blocked_reason: "visitor_blocked", message_length: 0, strike_count: ABUSE_STRIKE_THRESHOLD });
    return NextResponse.json({ text: getRefusalMsg("en") });
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (!checkRateLimit(ip)) {
    logAbuse({ timestamp: new Date().toISOString(), ip, page_url: null, intent: null, blocked_reason: "rate_limit_exceeded", message_length: 0 });
    return NextResponse.json({ text: getRateLimitMsg("en") }, { status: 429 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawMessage        = typeof body.message        === "string" ? body.message        : null;
  const intent            = typeof body.intent         === "string" ? body.intent         : null;
  const pathname          = typeof body.pathname       === "string" ? body.pathname       : null;
  const sttLang           = typeof body.sttLang        === "string" ? body.sttLang        : "en-US";
  const propertyTitle     = typeof body.propertyTitle  === "string" ? body.propertyTitle  : null;
  const propertyCode      = typeof body.propertyCode   === "string" ? body.propertyCode   : null;
  const propertyLocation  = typeof body.propertyLocation === "string" ? body.propertyLocation : null;

  const rawHistory = Array.isArray(body.chatHistory) ? body.chatHistory : [];
  const chatHistory = rawHistory
    .filter(
      (m): m is { role: "user" | "assistant"; text: string } =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.text === "string"
    )
    .slice(-10); // last 10 turns max

  const uiLang = detectLang(sttLang);

  // ── Message length cap ────────────────────────────────────────────────────
  if (rawMessage !== null && rawMessage.length > MAX_MESSAGE_LENGTH) {
    logAbuse({ timestamp: new Date().toISOString(), ip, page_url: pathname, intent, blocked_reason: "message_too_long", message_length: rawMessage.length });
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = rawMessage?.replace(/\s+/g, " ").trim() ?? null;

  // ── Empty / too-short message ─────────────────────────────────────────────
  if (message !== null && message.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // ── Injection detection (runs BEFORE AI) ─────────────────────────────────
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
        return NextResponse.json({ text: nowBlocked ? getRefusalMsg(uiLang) : getRefusalMsg(uiLang) });
      }
    }
  }

  if (!intent && !message) {
    return NextResponse.json({ error: "No intent or message provided" }, { status: 400 });
  }

  // ── Build user turn text for AI ───────────────────────────────────────────
  //
  // For intent (quick-action): use a description so the AI understands the context.
  // For free-text: use the raw message.
  //
  const userText = message ?? (intent ? (INTENT_LABELS[intent] ?? `User selected: ${intent}`) : "");

  // ── Property search (for discovery turns) ────────────────────────────────
  //
  // Run in all cases: AI gets the results as context.
  // Only returned to client when matches are found.
  //
  let propertyMatches: ChatMatch[] = [];
  let matchesExact = true;
  try {
    const criteria = await parseCriteria(userText);
    if (hasCriteria(criteria)) {
      const sr: SearchResult = await searchProperties(criteria);
      propertyMatches = sr.results;
      matchesExact    = sr.isExact;
    }
  } catch {
    // Non-fatal — AI continues without matches
  }

  // ── Build conversation messages for AI ───────────────────────────────────

  const aiMessages: Anthropic.MessageParam[] = [
    // Inject prior turns from chat history
    ...chatHistory.map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.text,
    })),
    // Current user turn
    { role: "user" as const, content: userText },
  ];

  // ── Build system prompt ───────────────────────────────────────────────────

  let matchesBlock: string | undefined;
  if (propertyMatches.length > 0) {
    matchesBlock = propertyMatches.map(p => {
      let line = `- "${p.title}"`;
      if (p.location_text) line += ` in ${p.location_text}`;
      if (p.bedrooms != null) line += `, ${p.bedrooms} bed`;
      if (p.size != null) line += `, ${p.size} m²`;
      if (p.price != null) line += `, €${p.price.toLocaleString()}`;
      if (p.property_code) line += ` (${p.property_code})`;
      return line;
    }).join("\n");
  }

  const systemPrompt = buildSystemPrompt({
    lang:    uiLang,
    matchesBlock,
    isExact: matchesExact,
    ...(propertyTitle ? {
      propertyContext: {
        title:    propertyTitle,
        code:     propertyCode    ?? undefined,
        location: propertyLocation ?? undefined,
      },
    } : {}),
  });

  // ── Call AI ───────────────────────────────────────────────────────────────

  const aiResult = await callAi({ systemPrompt, messages: aiMessages });

  if (!aiResult) {
    // AI unavailable → localized fallback
    const fallback = getFallback(uiLang);
    return NextResponse.json({
      text:            fallback.text,
      triggerLeadForm: fallback.triggerLeadForm,
    });
  }

  // ── High-intent chat alert ────────────────────────────────────────────────

  const { isHigh, reason } = isHighIntentSignal({
    triggerLeadForm: aiResult.triggerLeadForm,
    intent,
    message,
  });

  console.info("[chat-alert] high-intent check", {
    isHigh,
    reason,
    intent,
  });

  const canSendAlert = isHigh ? canSendChatAlert(ip) : false;

  if (isHigh && !canSendAlert) {
    console.info("[chat-alert] skipped: cooldown", {
      reason,
      intent,
    });
  }

  if (isHigh && canSendAlert) {
    recordChatAlert(ip);

    console.info("[chat-alert] sending", {
      reason,
      intent,
    });

    try {
      const ok = await sendChatAlertNotification({
        intent,
        reason,
        source: "Chat widget",
        language: sttLang,
        page_url: pathname,
        message,
        property_title: propertyTitle,
        property_code: propertyCode,
        property_location: propertyLocation,
        contact_found: detectContactInMessage(message ?? ""),
        admin_url: buildLeadsDashboardUrl(),
      });

      if (ok) {
        console.info("[chat-alert] sent", { ok, reason, intent });
      } else {
        console.warn("[chat-alert] failed/skipped", { ok, reason, intent });
      }
    } catch (err) {
      console.error("[chat-alert] error", {
        reason,
        intent,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Return response ───────────────────────────────────────────────────────

  return NextResponse.json({
    text:            aiResult.replyText,
    triggerLeadForm: aiResult.triggerLeadForm,
    ...(propertyMatches.length > 0 ? { matches: propertyMatches } : {}),
  });
}
