import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { sendTelegramLeadNotification } from "@/lib/telegram/sendTelegramLeadNotification";

/*
 * POST /api/leads
 * Public endpoint — no auth required.
 *
 * Body:
 *   name              string    required
 *   whatsapp          string    required — format: +[1-9][digits], total 8–15 digits, no spaces
 *   email             string?   optional — basic format validated if non-empty
 *   notes             string?   optional — notes or preferred time
 *   consent_whatsapp  boolean   required — must be true; contact without consent not accepted
 *   source            string    required — page context: home|properties|property|investment-guide|private|other
 *   intent            string?   optional — chat intent key
 *   page_url          string?   optional
 *   property_id       string?   optional — uuid FK; drives lead_type = property vs general
 *   chat_log          array?    optional — [{role, text}] stored as JSON string
 *
 * DB column mapping:
 *   whatsapp → phone      (existing column reused)
 *   intent + notes + lead_type + consent → summary (text, \n-separated)
 *   chat_log array → full_chat (text, JSON.stringify)
 */

const WHATSAPP_RE = /^\+[1-9]\d{7,14}$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Required fields ───────────────────────────────────────────────────────

  const name     = typeof body.name     === "string" ? body.name.trim()     : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 422 });
  }

  if (!whatsapp) {
    return NextResponse.json({ error: "WhatsApp number is required" }, { status: 422 });
  }

  if (!WHATSAPP_RE.test(whatsapp)) {
    return NextResponse.json(
      { error: "Invalid WhatsApp format — include country code, no spaces (e.g. +306912345678)" },
      { status: 422 }
    );
  }

  // consent_whatsapp must be explicitly true
  if (body.consent_whatsapp !== true) {
    return NextResponse.json(
      { error: "WhatsApp contact consent is required" },
      { status: 422 }
    );
  }

  // ── Optional fields ───────────────────────────────────────────────────────

  const email  = typeof body.email  === "string" ? body.email.trim()  : null;
  const notes  = typeof body.notes  === "string" ? body.notes.trim()  : null;
  const intent = typeof body.intent === "string" ? body.intent        : null;
  const source = typeof body.source === "string" ? body.source        : "other";

  const page_url = typeof body.page_url === "string" ? body.page_url : null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  // ── Property context ──────────────────────────────────────────────────────

  const rawPropertyId = body.property_id;
  const property_id =
    typeof rawPropertyId === "string" && rawPropertyId.length > 0
      ? rawPropertyId
      : null;

  const property_title =
    typeof body.property_title === "string" && body.property_title.length > 0
      ? body.property_title
      : null;

  const property_code =
    typeof body.property_code === "string" && body.property_code.length > 0
      ? body.property_code
      : null;

  const property_slug =
    typeof body.property_slug === "string" && body.property_slug.length > 0
      ? body.property_slug
      : null;

  const property_location =
    typeof body.property_location === "string" && body.property_location.length > 0
      ? body.property_location
      : null;

  const entry_intent =
    typeof body.entry_intent === "string" && body.entry_intent.length > 0
      ? body.entry_intent
      : null;

  // lead_type: property if property context attached, else general
  const lead_type = property_id ? "property" : "general";

  // ── full_chat ─────────────────────────────────────────────────────────────

  const rawChatLog = body.chat_log;
  const full_chat =
    Array.isArray(rawChatLog) && rawChatLog.length > 0
      ? JSON.stringify(rawChatLog)
      : null;

  // ── Summary (human-readable block stored in summary column) ───────────────
  //
  // Format example:
  //   Type: property
  //   Intent: golden_visa
  //   Notes: call me after 3pm
  //   Consent: WhatsApp ✓

  const summaryParts: string[] = [];
  summaryParts.push(`Type: ${lead_type}`);
  if (entry_intent && entry_intent !== intent) summaryParts.push(`Entry Intent: ${entry_intent}`);
  if (intent)            summaryParts.push(`Intent: ${intent}`);
  if (property_location) summaryParts.push(`Location: ${property_location}`);
  if (property_slug)     summaryParts.push(`Property URL: /properties/${property_slug}`);
  if (notes)             summaryParts.push(`Notes: ${notes}`);
  summaryParts.push("Consent: WhatsApp ✓");
  const summary = summaryParts.join("\n");

  // ── Insert ────────────────────────────────────────────────────────────────

  const admin = createSupabaseAdminClient();

  const { data: inserted, error } = await admin
    .from("leads")
    .insert({
      name,
      phone:             whatsapp,   // WhatsApp number stored in existing `phone` column
      email:             email || null,
      lead_type,
      source,
      page_url,
      property_id,
      property_title,
      property_code,
      property_slug,
      property_location,
      entry_intent,
      summary,
      full_chat,
      status:            "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/leads] insert error:", error.message);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }

  // ── Telegram notification (fire-and-forget, never breaks the response) ────
  const siteUrl = process.env.SITE_URL ?? null;
  const adminUrl =
    siteUrl && inserted?.id
      ? `${siteUrl}/admin/leads?id=${inserted.id}`
      : null;

  sendTelegramLeadNotification({
    lead_type,
    source,
    name,
    phone:             whatsapp,
    email,
    property_id,
    property_title,
    property_code,
    property_slug,
    property_location,
    entry_intent,
    page_url,
    intent,
    notes,
    admin_url: adminUrl,
    created_at: new Date().toISOString(),
  }).catch((err) => console.error("[Telegram] unexpected error:", err));

  return NextResponse.json({ ok: true }, { status: 201 });
}
