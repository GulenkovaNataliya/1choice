/**
 * Server-side helper — Telegram lead notifications.
 * Called after a lead is successfully saved to Supabase.
 * Never throws; failures are logged but do not affect the lead creation response.
 *
 * Required env vars (server-side only):
 *   TELEGRAM_BOT_TOKEN   — bot token from @BotFather
 *   TELEGRAM_CHAT_ID     — numeric chat/channel id to post into
 */

export interface TelegramLeadData {
  lead_type: "property" | "general";
  source: string;
  name: string;
  phone: string;
  email: string | null;
  property_id: string | null;
  property_title?: string | null;
  property_code?: string | null;
  property_slug?: string | null;
  property_location?: string | null;
  entry_intent?: string | null;
  page_url: string | null;
  intent: string | null;
  notes: string | null;
  admin_url?: string | null;        // direct link to admin leads page with ?id=LEAD_ID
  created_at?: string;              // ISO string; defaults to now if omitted
}

function esc(text: string): string {
  // Escape special HTML chars for Telegram HTML parse mode
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMessage(data: TelegramLeadData): string {
  const ts = data.created_at
    ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const typeEmoji = data.lead_type === "property" ? "🏠" : "📋";
  const sourceLabel = data.source || "unknown";

  const lines: string[] = [
    `${typeEmoji} <b>New Lead — ${esc(data.lead_type === "property" ? "Property" : "General")}</b>`,
    "",
    `👤 <b>Name:</b> ${esc(data.name)}`,
    `📱 <b>WhatsApp:</b> ${esc(data.phone)}`,
  ];

  if (data.email) {
    lines.push(`📧 <b>Email:</b> ${esc(data.email)}`);
  }

  lines.push(`🌐 <b>Source:</b> ${esc(sourceLabel)}`);

  if (data.page_url) {
    lines.push(`🔗 <b>Page:</b> ${esc(data.page_url)}`);
  }

  if (data.property_title) {
    const propLabel = data.property_code
      ? `${data.property_title} (${data.property_code})`
      : data.property_title;
    lines.push(`🏡 <b>Property:</b> ${esc(propLabel)}`);
  } else if (data.property_id) {
    lines.push(`🏡 <b>Property ID:</b> ${esc(data.property_id)}`);
  }

  if (data.property_location) {
    lines.push(`📍 <b>Location:</b> ${esc(data.property_location)}`);
  }

  if (data.entry_intent && data.entry_intent !== data.intent) {
    lines.push(`🚪 <b>Entry Intent:</b> ${esc(data.entry_intent)}`);
  }

  if (data.intent) {
    lines.push(`🎯 <b>Intent:</b> ${esc(data.intent)}`);
  }

  if (data.notes) {
    lines.push(`💬 <b>Notes:</b> ${esc(data.notes)}`);
  }

  if (data.admin_url) {
    lines.push(``, `<a href="${esc(data.admin_url)}">🔧 Open in Admin</a>`);
  }

  lines.push(``, `🕐 ${esc(ts)}`);

  return lines.join("\n");
}

export async function sendTelegramLeadNotification(
  data: TelegramLeadData
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Telegram not configured — skip silently
    return false;
  }

  const text = formatMessage(data);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[Telegram] sendMessage failed:", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram] sendMessage error:", err);
    return false;
  }
}
