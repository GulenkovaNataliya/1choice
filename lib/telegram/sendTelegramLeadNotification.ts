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
  page_url: string | null;
  intent: string | null;
  notes: string | null;
  admin_url?: string | null;        // direct link to admin leads page with ?id=LEAD_ID
  created_at?: string;              // ISO string; defaults to now if omitted
}

function escape(text: string): string {
  // Escape special chars for Telegram MarkdownV2
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function escapeUrl(url: string): string {
  // Inside MarkdownV2 link URLs only ) and \ need escaping
  return url.replace(/[)\\]/g, "\\$&");
}

function formatMessage(data: TelegramLeadData): string {
  const ts = data.created_at
    ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const typeEmoji = data.lead_type === "property" ? "🏠" : "📋";
  const sourceLabel = data.source || "unknown";

  const lines: string[] = [
    `${typeEmoji} *New Lead — ${escape(data.lead_type === "property" ? "Property" : "General")}*`,
    "",
    `👤 *Name:* ${escape(data.name)}`,
    `📱 *WhatsApp:* ${escape(data.phone)}`,
  ];

  if (data.email) {
    lines.push(`📧 *Email:* ${escape(data.email)}`);
  }

  lines.push(`🌐 *Source:* ${escape(sourceLabel)}`);

  if (data.page_url) {
    lines.push(`🔗 *Page:* ${escape(data.page_url)}`);
  }

  if (data.property_title) {
    const propLabel = data.property_code
      ? `${data.property_title} (${data.property_code})`
      : data.property_title;
    lines.push(`🏡 *Property:* ${escape(propLabel)}`);
  } else if (data.property_id) {
    lines.push(`🏡 *Property ID:* ${escape(data.property_id)}`);
  }

  if (data.intent) {
    lines.push(`🎯 *Intent:* ${escape(data.intent)}`);
  }

  if (data.notes) {
    lines.push(`💬 *Notes:* ${escape(data.notes)}`);
  }

  if (data.admin_url) {
    lines.push(``, `[🔧 Open in Admin](${escapeUrl(data.admin_url)})`);
  }

  lines.push(``, `🕐 ${escape(ts)}`);

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
          parse_mode: "MarkdownV2",
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
