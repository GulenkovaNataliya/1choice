/**
 * Server-side helper - Telegram lead notifications.
 * Called after a lead is successfully saved to Supabase.
 * Never throws; failures are logged but do not affect the lead creation response.
 *
 * Required env vars (server-side only):
 *   TELEGRAM_BOT_TOKEN - bot token from @BotFather
 *   TELEGRAM_CHAT_ID   - numeric chat/channel id to post into
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
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const INTENT_LABELS: Record<string, string> = {
  property_search:     "Property Search",
  investment_strategy: "Investment Strategy",
  golden_visa:         "Golden Visa",
  viewing_request:     "Viewing Request",
  contact_advisor:     "Contact Advisor",
  property_viewing:    "Property Viewing",
  property_inquiry:    "Property Inquiry",
  general_question:    "General Question",
};

const SOURCE_LABELS: Record<string, string> = {
  home:               "Home",
  properties:         "Properties",
  property:           "Property",
  "golden-visa":      "Golden Visa",
  "investment-guide": "Investment Guide",
  private:            "Private",
  saved:              "Saved",
  compare:            "Compare",
  chat:               "Chat",
};

function labelValue(value: string | null | undefined, labels: Record<string, string>): string | null {
  if (!value) return null;
  return labels[value] ?? value;
}

function formatMessage(data: TelegramLeadData): string {
  const ts = data.created_at
    ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const leadTypeLabel = data.lead_type === "property" ? "Property" : "General";
  const sourceLabel = labelValue(data.source, SOURCE_LABELS) ?? "Unknown";
  const entryIntentLabel = labelValue(data.entry_intent, INTENT_LABELS);
  const intentLabel = labelValue(data.intent, INTENT_LABELS);

  const lines: string[] = [
    `<b>New Lead - ${esc(leadTypeLabel)}</b>`,
    "",
    `<b>Name:</b> ${esc(data.name)}`,
    `<b>WhatsApp:</b> ${esc(data.phone)}`,
  ];

  if (data.email) {
    lines.push(`<b>Email:</b> ${esc(data.email)}`);
  }

  lines.push(`<b>Source:</b> ${esc(sourceLabel)}`);

  if (data.page_url) {
    lines.push(`<b>Page:</b> ${esc(data.page_url)}`);
  }

  if (data.property_title) {
    const propLabel = data.property_code
      ? `${data.property_title} (${data.property_code})`
      : data.property_title;
    lines.push(`<b>Property:</b> ${esc(propLabel)}`);
  } else if (data.property_id) {
    lines.push(`<b>Property ID:</b> ${esc(data.property_id)}`);
  }

  if (data.property_location) {
    lines.push(`<b>Location:</b> ${esc(data.property_location)}`);
  }

  if (entryIntentLabel && data.entry_intent !== data.intent) {
    lines.push(`<b>Entry Intent:</b> ${esc(entryIntentLabel)}`);
  }

  if (intentLabel) {
    lines.push(`<b>Intent:</b> ${esc(intentLabel)}`);
  }

  if (data.notes) {
    lines.push(`<b>Notes:</b> ${esc(data.notes)}`);
  }

  lines.push("", esc(ts));

  return lines.join("\n");
}

export async function sendTelegramLeadNotification(
  data: TelegramLeadData
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
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
          ...(data.admin_url
            ? {
                reply_markup: {
                  inline_keyboard: [[
                    { text: "Open Lead in Admin", url: data.admin_url },
                  ]],
                },
              }
            : {}),
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
