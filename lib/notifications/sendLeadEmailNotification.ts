/**
 * Server-side helper — email lead notifications via Resend.
 * Called after a lead is successfully saved to Supabase.
 * Never throws; failures are logged but do not affect the lead creation response.
 *
 * Required env vars (server-side only):
 *   RESEND_API_KEY             — API key from resend.com
 *   LEAD_NOTIFICATION_EMAIL    — recipient address, e.g. team@1choice.gr
 */

import { Resend } from "resend";

export interface EmailLeadData {
  lead_type: "property" | "general";
  name: string;
  phone: string;
  email: string | null;
  source: string;
  intent: string | null;
  entry_intent: string | null;
  notes: string | null;
  property_title?: string | null;
  property_code?: string | null;
  property_slug?: string | null;
  property_location?: string | null;
  page_url: string | null;
  admin_url?: string | null;
  created_at?: string;
}

function formatEmailHtml(data: EmailLeadData): string {
  const ts = data.created_at
    ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 12px 6px 0;color:#888888;white-space:nowrap;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:6px 0;color:#1E1E1E;font-size:13px;font-weight:500;">${value}</td>
    </tr>`;

  const propertyLabel = data.property_title
    ? `${data.property_title}${data.property_code ? ` (${data.property_code})` : ""}`
    : null;

  const propertyLink = data.property_slug
    ? `<a href="https://1choice.gr/properties/${data.property_slug}" style="color:#3A2E4F;">View listing ↗</a>`
    : null;

  const rows = [
    row("Type",         data.lead_type === "property" ? "Property" : "General"),
    data.intent         ? row("Intent",        data.intent)                      : "",
    data.entry_intent   ? row("Entry Intent",  data.entry_intent)                : "",
    row("Name",         data.name),
    row("WhatsApp",     data.phone),
    data.email          ? row("Email",         data.email)                       : "",
    row("Source",       data.source || "unknown"),
    data.page_url       ? row("Page",          data.page_url)                    : "",
    propertyLabel       ? row("Property",      propertyLabel + (propertyLink ? `&nbsp;&nbsp;${propertyLink}` : "")) : "",
    data.property_location ? row("Location",   data.property_location)           : "",
    data.notes          ? row("Notes",         data.notes.replace(/\n/g, "<br>")) : "",
    row("Time",         ts),
  ].filter(Boolean).join("\n");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E8E8E8;">

    <!-- Header -->
    <div style="background:#1E1E1E;padding:20px 28px;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#FFFFFF;">New Lead — 1Choice</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <!-- CTA -->
    ${data.admin_url ? `
    <div style="padding:0 28px 28px;">
      <a href="${data.admin_url}"
         style="display:inline-block;padding:10px 20px;background:#3A2E4F;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">
        Open in Admin Panel →
      </a>
    </div>` : ""}

  </div>
</body>
</html>`;
}

function formatEmailText(data: EmailLeadData): string {
  const ts = data.created_at
    ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const lines: string[] = ["New lead received", ""];
  lines.push(`Type:          ${data.lead_type === "property" ? "Property" : "General"}`);
  if (data.intent)       lines.push(`Intent:        ${data.intent}`);
  if (data.entry_intent) lines.push(`Entry Intent:  ${data.entry_intent}`);
  lines.push("");
  lines.push(`Name:     ${data.name}`);
  lines.push(`WhatsApp: ${data.phone}`);
  if (data.email) lines.push(`Email:    ${data.email}`);
  lines.push("");
  lines.push(`Source:   ${data.source || "unknown"}`);
  if (data.page_url) lines.push(`Page:     ${data.page_url}`);
  if (data.property_title) {
    const label = data.property_title + (data.property_code ? ` (${data.property_code})` : "");
    lines.push(`Property: ${label}`);
  }
  if (data.property_slug)     lines.push(`          https://1choice.gr/properties/${data.property_slug}`);
  if (data.property_location) lines.push(`Location: ${data.property_location}`);
  if (data.notes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(data.notes);
  }
  lines.push("");
  lines.push(`Time: ${ts}`);
  if (data.admin_url) {
    lines.push("");
    lines.push(`Admin panel: ${data.admin_url}`);
  }

  return lines.join("\n");
}

export async function sendLeadEmailNotification(data: EmailLeadData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_NOTIFICATION_EMAIL;

  if (!apiKey || !toEmail) {
    // Email notifications not configured — skip silently
    return false;
  }

  const resend = new Resend(apiKey);
  const subject = data.lead_type === "property"
    ? `New Lead — ${data.name} (Property)`
    : `New Lead — ${data.name} (General)`;

  try {
    const { error } = await resend.emails.send({
      from:    "1Choice Leads <leads@1choice.gr>",
      to:      [toEmail],
      subject,
      html:    formatEmailHtml(data),
      text:    formatEmailText(data),
    });

    if (error) {
      console.error("[Email] lead notification error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] lead notification failed:", err);
    return false;
  }
}
