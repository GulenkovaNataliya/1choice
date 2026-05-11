/**
 * Telegram high-intent chat alert.
 * Sent when a chat message shows strong purchase/viewing intent,
 * BEFORE the user has submitted a lead form.
 *
 * This is an early-warning signal only - no DB record is created.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

export interface ChatAlertData {
  intent:             string | null;
  reason:             string;         // why flagged: trigger_lead_form | viewing_signal | contact_signal | phone_in_message | email_in_message | high_intent_keywords
  source:             string | null;
  language?:          string | null;
  page_url:           string | null;
  message:            string | null;  // user's message text (truncated if long)
  property_title?:    string | null;
  property_code?:     string | null;
  property_location?: string | null;
  contact_found:      boolean;        // email/phone detected in message
  admin_url?:         string | null;  // /admin/leads (no specific lead yet)
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const REASON_LABELS: Record<string, string> = {
  trigger_lead_form:    "AI suggested a lead form",
  viewing_signal:       "Viewing or visit request",
  contact_signal:       "Consultation or contact request",
  phone_in_message:     "Phone number in chat message",
  email_in_message:     "Email address in chat message",
  high_intent_keywords: "High-intent buying keywords",
  intent_action:        "High-intent quick action",
};

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

function labelIntent(intent: string | null): string | null {
  if (!intent) return null;
  return INTENT_LABELS[intent] ?? intent;
}

export async function sendChatAlertNotification(data: ChatAlertData): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const reasonLabel = REASON_LABELS[data.reason] ?? data.reason;
  const intentLabel = labelIntent(data.intent);

  const lines: string[] = [
    `<b>High-Intent Chat Alert</b>`,
    `Not a submitted lead yet - the visitor has not completed the lead form, so no lead record exists yet.`,
    "",
    `<b>Signal:</b> ${esc(reasonLabel)}`,
  ];

  if (intentLabel) lines.push(`<b>Intent:</b> ${esc(intentLabel)}`);
  if (data.source) lines.push(`<b>Source:</b> ${esc(data.source)}`);
  if (data.language) lines.push(`<b>Language:</b> ${esc(data.language)}`);
  if (data.page_url) lines.push(`<b>Page:</b> ${esc(data.page_url)}`);

  if (data.property_title) {
    const propLabel = data.property_code
      ? `${data.property_title} (${data.property_code})`
      : data.property_title;
    lines.push(`<b>Property:</b> ${esc(propLabel)}`);
  }
  if (data.property_location) {
    lines.push(`<b>Location:</b> ${esc(data.property_location)}`);
  }

  if (data.message) {
    const preview = data.message.length > 250
      ? `${data.message.slice(0, 250)}...`
      : data.message;
    lines.push("", `<b>Message:</b> ${esc(preview)}`);
  }

  lines.push(`<b>Contact found in message:</b> ${data.contact_found ? "Yes" : "No"}`);

  if (data.contact_found) {
    lines.push(`If contact details are visible in the chat message, follow up manually.`);
  }

  lines.push("", esc(ts));

  const text = lines.join("\n");

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
                    { text: "Open Leads Dashboard", url: data.admin_url },
                  ]],
                },
              }
            : {}),
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[chat-alert] sendMessage failed:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[chat-alert] sendMessage error:", err);
    return false;
  }
}
