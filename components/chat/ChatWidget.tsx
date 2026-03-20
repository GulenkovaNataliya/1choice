"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useChatProperty } from "./ChatPropertyContext";
import { detectLang, getFormStrings } from "@/lib/chat/chatI18n";

// ── Types ────────────────────────────────────────────────────────────────────

type Intent =
  | "property_search"
  | "investment_strategy"
  | "golden_visa"
  | "viewing_request"
  | "general_question"
  | "property_viewing"
  | "property_inquiry";

type ChatMatch = {
  id:            string;
  title:         string;
  slug:          string;
  property_code: string | null;
  location_text: string | null;
  size:          number | null;
  bedrooms:      number | null;
  price:         number | null;
};

type Message = {
  role:     "user" | "bot";
  text:     string;
  matches?: ChatMatch[];
};

type LeadForm = {
  name:             string;
  whatsapp:         string;
  email:            string;
  notes:            string;
  consent_whatsapp: boolean;
};

type LeadErrors = {
  name?:             string;
  whatsapp?:         string;
  email?:            string;
  consent_whatsapp?: string;
};

// ── Quick actions ─────────────────────────────────────────────────────────────
// Exactly 3 default startup actions. "Private Collection" is not a startup action.

type QuickAction = { label: string; intent: Intent };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Explore Properties",  intent: "property_search" },
  { label: "Investment Strategy", intent: "investment_strategy" },
  { label: "Golden Visa",         intent: "golden_visa" },
];

// ── Server-side bot response fetch ───────────────────────────────────────────
//
// Advisory response text lives in /api/chat (server-side only, not in bundle).
// This helper fetches the response; on network failure returns a localized fallback.
//
type BotResult = { text: string; triggerLeadForm: boolean; matches?: ChatMatch[] };

async function fetchBotResponse(
  params: { intent?: string; message?: string },
  pathname: string,
  conversationStep: number,
  sttLang: string,
  chatHistory: Message[],
  propertyContext: { title?: string | null; code?: string | null; location?: string | null },
  fallbackText: string,
): Promise<BotResult> {
  const fallback: BotResult = { text: fallbackText, triggerLeadForm: false };
  try {
    const historyPayload = chatHistory.map((m) => ({
      role: m.role === "bot" ? "assistant" : "user",
      text: m.text,
    }));
    const res = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...params,
        pathname,
        conversationStep,
        sttLang,
        chatHistory:      historyPayload,
        propertyTitle:    propertyContext.title    ?? null,
        propertyCode:     propertyContext.code     ?? null,
        propertyLocation: propertyContext.location ?? null,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (
      typeof json === "object" && json !== null &&
      "text" in json &&
      typeof (json as Record<string, unknown>).text === "string"
    ) {
      const j = json as { text: string; triggerLeadForm?: unknown; matches?: unknown };
      return {
        text:            j.text,
        triggerLeadForm: j.triggerLeadForm === true,
        matches:         Array.isArray(j.matches) ? (j.matches as ChatMatch[]) : undefined,
      };
    }
    return fallback;
  } catch {
    // Covers network errors and AbortSignal timeout
    return fallback;
  }
}

// ── Page-specific welcome messages ────────────────────────────────────────────
//
// Each page context gets a distinct first assistant message.
// Tone: advisory, calm, premium — not chatty, not pushy.
// No fabricated facts. No emojis.

type PageContext =
  | "home"
  | "properties"
  | "property_detail"
  | "investment_guide"
  | "private"
  | "default";

const WELCOME_MESSAGES: Record<PageContext, string> = {
  home:
    "Welcome to 1Choice. I am here to help you explore properties, understand investment options, or discuss the Greek Golden Visa programme. Where would you like to start?",
  properties:
    "I can help you refine your search or identify properties that match your requirements. What are you looking for?",
  property_detail:
    // Populated dynamically with property title — see buildGreeting()
    "",
  investment_guide:
    "This guide covers the key considerations for property investment and ownership in Greece. If you have specific questions, I am here to help — or I can connect you with an advisor.",
  private:
    "You are viewing our private collection. I can assist with specific enquiries or connect you with an advisor. How can I help?",
  default:
    "I am here to assist with property search, investment guidance, or the Greek Golden Visa programme. How can I help?",
};

// ── WhatsApp validation ───────────────────────────────────────────────────────

const WHATSAPP_RE = /^\+[1-9]\d{7,14}$/;

// ── Icons ─────────────────────────────────────────────────────────────────────

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      width="17" height="17" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5L17 6l2 2-1.5 1.5" />
      <path d="M11.5 9.5L13 8" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8"  y1="22" x2="16" y2="22" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="currentColor" stroke="none"
      className={className} aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

// ── Source derivation ─────────────────────────────────────────────────────────

function pageSource(pathname: string): string {
  if (pathname === "/")                           return "home";
  if (pathname === "/properties")                 return "properties";
  if (pathname.startsWith("/properties/"))        return "property";
  if (pathname === "/investment-ownership-guide") return "investment-guide";
  if (pathname === "/golden-visa-greece")         return "golden-visa";
  if (pathname === "/private")                    return "private";
  if (pathname === "/saved")                      return "saved";
  if (pathname === "/compare")                    return "compare";
  return "other";
}

// ── Component ────────────────────────────────────────────────────────────────

const EMPTY_LEAD: LeadForm = {
  name:             "",
  whatsapp:         "",
  email:            "",
  notes:            "",
  consent_whatsapp: false,
};

// Max recording duration in ms
const STT_MAX_MS = 60_000;

// ── Voice language options ────────────────────────────────────────────────────
// Controls recognition.lang. Persisted in localStorage under STT_LANG_KEY.

const STT_LANG_KEY = "1choice_stt_lang";

const VOICE_LANGS = [
  { code: "ar",    label: "Arabic"  },
  { code: "he-IL", label: "Hebrew"  },
  { code: "ru-RU", label: "Russian" },
  { code: "en-US", label: "English" },
  { code: "el-GR", label: "Greek"   },
] as const;

type VoiceLangCode = typeof VOICE_LANGS[number]["code"];

// Default: check localStorage → match navigator.language → fall back to en-US
function resolveDefaultLang(): VoiceLangCode {
  if (typeof window === "undefined") return "en-US";
  const saved = localStorage.getItem(STT_LANG_KEY) as VoiceLangCode | null;
  if (saved && VOICE_LANGS.some((l) => l.code === saved)) return saved;
  const nav = navigator.language ?? "";
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("he")) return "he-IL";
  if (nav.startsWith("ru")) return "ru-RU";
  if (nav.startsWith("el")) return "el-GR";
  return "en-US";
}

export default function ChatWidget() {
  const pathname         = usePathname();
  const { propertyData } = useChatProperty();

  // Property context forwarded to the AI — derived from page-level context provider
  const propCtx = {
    title:    propertyData?.property_title    ?? null,
    code:     propertyData?.property_code     ?? null,
    location: propertyData?.property_location ?? null,
  };

  // ── Chat state ────────────────────────────────────────────────────────────
  const [isOpen,     setIsOpen]     = useState(false);
  const [msgs,       setMsgs]       = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [intent,     setIntent]     = useState<Intent | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [lead,       setLead]       = useState<LeadForm>(EMPTY_LEAD);
  const [errors,     setErrors]     = useState<LeadErrors>({});
  const [submitted,    setSubmitted]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [isLoadingBot, setIsLoadingBot] = useState(false);

  // Captures the first CTA intent that opened the chat — never overwritten.
  // intent state can change if the user picks a quick action; entryIntentRef preserves origin.
  const entryIntentRef = useRef<Intent | null>(null);

  // ── STT state ─────────────────────────────────────────────────────────────
  // sttSupported: null = not yet checked (SSR safe), true/false after mount
  const [sttSupported, setSttSupported] = useState<boolean | null>(null);
  const [isRecording,  setIsRecording]  = useState(false);
  const [sttMessage,   setSttMessage]   = useState<string | null>(null);
  // sttLang: initialised as en-US; corrected client-side in the detection effect
  const [sttLang,      setSttLang]      = useState<VoiceLangCode>("en-US");

  // Localized lead form strings — re-derived whenever sttLang changes
  const s = getFormStrings(detectLang(sttLang));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const sttTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const msgsEndRef = useRef<HTMLDivElement>(null);

  // ── Detect STT support + resolve saved/default language (client only) ───────
  //
  // Web Speech API: supported in Chrome, Edge, Safari (partial).
  // Firefox and some mobile browsers do not support it.
  // We use webkitSpeechRecognition as the vendor-prefixed fallback.
  //
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSttSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    // Load persisted language (or auto-detect) now that we're client-side
    setSttLang(resolveDefaultLang());
  }, []);

  // ── STT: change language + persist to localStorage ────────────────────────
  function handleLangChange(code: VoiceLangCode) {
    setSttLang(code);
    localStorage.setItem(STT_LANG_KEY, code);
  }

  // ── STT: stop recording (idempotent) ─────────────────────────────────────
  const stopRecording = useCallback((limitReached = false) => {
    if (sttTimerRef.current) {
      clearTimeout(sttTimerRef.current);
      sttTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (limitReached) {
      setSttMessage("60-second limit reached. Edit your message and press Send.");
      setTimeout(() => setSttMessage(null), 4000);
    }
  }, []);

  // ── STT: start recording ──────────────────────────────────────────────────
  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w  = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang            = sttLang;   // user-selected; persisted in localStorage
    recognition.interimResults  = false;   // final transcript only — no partials
    recognition.maxAlternatives = 1;
    recognition.continuous      = false;   // single utterance; stops on silence

    // SpeechRecognitionEvent is not in the TS stdlib — use any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = ((e.results[0]?.[0]?.transcript as string) ?? "").trim();
      if (transcript) {
        // Append to existing input with a space; user edits before sending
        setInput((prev) => (prev.trim() ? prev.trim() + " " + transcript : transcript));
      }
      stopRecording();
    };

    recognition.onerror = () => {
      stopRecording();
    };

    recognition.onend = () => {
      // Fires after stop() or on silence. stopRecording is idempotent.
      stopRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setSttMessage(null);

    // 60-second hard limit
    sttTimerRef.current = setTimeout(() => {
      stopRecording(true);
    }, STT_MAX_MS);
  }

  // ── STT: toggle mic ───────────────────────────────────────────────────────
  function handleMicToggle() {
    if (sttSupported === false) {
      setSttMessage("Voice input is not supported on this device.");
      setTimeout(() => setSttMessage(null), 4000);
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // ── Visibility (whitelist) ────────────────────────────────────────────────
  const visible =
    pathname === "/" ||
    pathname.startsWith("/properties") ||
    pathname === "/saved" ||
    pathname === "/compare" ||
    pathname === "/investment-ownership-guide" ||
    pathname === "/private";

  // ── Button text variant ───────────────────────────────────────────────────
  const isPropertyDetail =
    pathname.startsWith("/properties/") && pathname !== "/properties";

  const launcherText = isPropertyDetail
    ? "Ask about this property"
    : "Need help choosing?";

  // ── Page context resolver ─────────────────────────────────────────────────
  function resolvePageContext(): PageContext {
    if (pathname === "/")                           return "home";
    if (pathname === "/properties")                 return "properties";
    if (isPropertyDetail)                           return "property_detail";
    if (pathname === "/investment-ownership-guide") return "investment_guide";
    if (pathname === "/private")                    return "private";
    return "default";
  }

  // ── Welcome greeting (page-specific) ─────────────────────────────────────
  //
  // Property detail: personalised to the open property (title + optional code).
  // All other pages: pulls from WELCOME_MESSAGES keyed by page context.
  // No fabricated facts — only data available in propertyData.
  //
  function buildGreeting(): Message {
    const ctx = resolvePageContext();

    if (ctx === "property_detail") {
      const title = propertyData?.property_title;
      const code  = propertyData?.property_code;
      const ref   = title
        ? (code ? `${title} (${code})` : title)
        : "this property";
      return {
        role: "bot",
        text: `You are currently viewing ${ref}. I can help you with questions about it, arrange a private viewing, or explore comparable options. How can I assist?`,
      };
    }

    return {
      role: "bot",
      text: WELCOME_MESSAGES[ctx],
    };
  }

  // ── Golden Visa programmatic-open helper ──────────────────────────────────
  //
  // Called by an external CTA (e.g. a button on /golden-visa-greece).
  // Opens the chat and immediately enters the golden_visa intent,
  // skipping the generic welcome and quick-action picker.
  //
  // Usage (future CTA integration):
  //   import { openChatWithGoldenVisaIntent } from "@/components/chat/ChatWidget";
  //   <button onClick={openChatWithGoldenVisaIntent}>Start here</button>
  //
  // For this step the function is defined inline and exposed via the module-level
  // ref pattern below. The CTA wiring is done in a later step.
  //
  async function openWithIntent(chosen: Intent, userLabel: string) {
    // Record the original CTA intent only on first call — never overwrite.
    if (entryIntentRef.current === null) {
      entryIntentRef.current = chosen;
    }
    setIsOpen(true);
    if (msgs.length === 0) {
      setMsgs([buildGreeting()]);
    }
    setIsLoadingBot(true);
    const { text, triggerLeadForm, matches } = await fetchBotResponse(
      { intent: chosen }, pathname, msgs.length, sttLang, msgs, propCtx, s.networkError,
    );
    setIsLoadingBot(false);
    setIntent(chosen);
    setMsgs((prev) => [
      ...prev,
      { role: "user", text: userLabel },
      { role: "bot",  text, matches },
    ]);
    if (triggerLeadForm) setShowForm(true);
  }

  // ── External programmatic-open via DOM event ─────────────────────────────
  //
  // Any component (e.g. GoldenVisaCTAButton on /golden-visa-greece) can open the
  // chat in a specific intent by dispatching:
  //   window.dispatchEvent(new CustomEvent("1choice:open-chat", {
  //     detail: { intent: "golden_visa", label: "Golden Visa" }
  //   }))
  //
  useEffect(() => {
    function onOpenChat(e: Event) {
      const { intent: chosen, label } = (e as CustomEvent<{ intent: Intent; label: string }>).detail;
      openWithIntent(chosen, label);
    }
    window.addEventListener("1choice:open-chat", onOpenChat);
    return () => window.removeEventListener("1choice:open-chat", onOpenChat);
  // openWithIntent closes over state — intentionally omitted from deps (recreated each render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ESC to close ──────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    stopRecording();
    setIsOpen(false);
  }, [stopRecording]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, showForm]);

  // ── Open ──────────────────────────────────────────────────────────────────
  function handleOpen() {
    setIsOpen(true);
    if (msgs.length === 0 && !intent) {
      setMsgs([buildGreeting()]);
    }
  }

  // ── Intent selection ──────────────────────────────────────────────────────
  async function selectIntent(chosen: Intent, label: string) {
    setIntent(chosen);
    setMsgs((prev) => [...prev, { role: "user", text: label }]);
    setIsLoadingBot(true);
    const { text, triggerLeadForm, matches } = await fetchBotResponse(
      { intent: chosen }, pathname, msgs.length, sttLang, msgs, propCtx, s.networkError,
    );
    setIsLoadingBot(false);
    setMsgs((prev) => [...prev, { role: "bot", text, matches }]);
    if (triggerLeadForm) setShowForm(true);
  }

  // ── Free-text send ────────────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || isRecording || isLoadingBot) return;
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", text }]);
    if (showForm) return;
    setIsLoadingBot(true);
    const { text: botText, triggerLeadForm, matches } = await fetchBotResponse(
      { message: text },
      pathname,
      msgs.length,
      sttLang,
      msgs,
      propCtx,
      s.networkError,
    );
    setIsLoadingBot(false);
    setMsgs((prev) => [...prev, { role: "bot", text: botText, matches }]);
    if (triggerLeadForm) setShowForm(true);
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: LeadErrors = {};
    if (!lead.name.trim()) errs.name = s.nameRequired;
    if (!lead.whatsapp.trim()) {
      errs.whatsapp = s.whatsappRequired;
    } else if (!WHATSAPP_RE.test(lead.whatsapp.trim())) {
      errs.whatsapp = s.whatsappFormat;
    }
    if (lead.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim()))
      errs.email = s.emailInvalid;
    if (!lead.consent_whatsapp)
      errs.consent_whatsapp = s.consentRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Lead submit ───────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const leadPayload = {
      name:             lead.name.trim(),
      whatsapp:         lead.whatsapp.trim(),
      email:            lead.email.trim() || null,
      notes:            lead.notes.trim() || null,
      consent_whatsapp: true,
      source:            pageSource(pathname),
      intent:            intent ?? "general_question",
      entry_intent:      entryIntentRef.current ?? null,
      page_url:          typeof window !== "undefined" ? window.location.href : null,
      property_id:       propertyData?.property_id       ?? null,
      property_title:    propertyData?.property_title    ?? null,
      property_code:     propertyData?.property_code     ?? null,
      property_slug:     propertyData?.property_slug     ?? null,
      property_location: propertyData?.property_location ?? null,
      chat_log:          msgs.map((m) => ({ role: m.role, text: m.text })),
    };

    try {
      const res = await fetch("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(leadPayload),
        signal:  AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors({ whatsapp: json.error ?? s.submitError });
        setSubmitting(false);
        return;
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      setErrors({
        whatsapp: isTimeout ? s.timeoutError : s.networkError,
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  // Return null only when neither the launcher nor the modal should render.
  // When isOpen is true (e.g. triggered by GoldenVisaCTAButton on a non-whitelisted
  // route), we must let the modal render even though the launcher is hidden.
  if (!visible && !isOpen) return null;

  return (
    <>
      {/* ── Launcher button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label={launcherText}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 h-14 bg-[#1E1E1E] text-[#F4F4F4] shadow-lg hover:bg-[#3A2E4F] transition-colors"
          style={{ minWidth: "200px", maxWidth: "240px", borderRadius: "20px" }}
        >
          <img
            src="/logo/logo-chat.png"
            alt=""
            aria-hidden="true"
            className="shrink-0 h-4.5 w-auto"
          />
          <span className="text-sm font-semibold leading-tight whitespace-nowrap">
            {launcherText}
          </span>
        </button>
      )}

      {/* ── Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(30,30,30,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* ── Modal ── */}
          <div
            className="w-full max-w-95 max-h-[min(600px,90vh)] flex flex-col bg-white shadow-2xl overflow-hidden"
            style={{ borderRadius: "18px" }}
          >
            {/* Header */}
            <div className="bg-[#1E1E1E] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo/logo-chat.png"
                  alt=""
                  aria-hidden="true"
                  className="shrink-0 h-4.5 w-auto"
                />
                <span className="text-sm font-semibold tracking-tight">
                  1Choice Advisory Assistant
                </span>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close chat"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 space-y-2 min-h-0">
              {msgs.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <span
                      className={`text-sm px-3 py-2 rounded-xl max-w-[82%] leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#1E1E1E] text-white rounded-br-sm"
                          : "bg-[#F2F2F2] text-[#1E1E1E] rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>

                  {/* Property match cards — only on bot messages with matches */}
                  {m.role === "bot" && m.matches && m.matches.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {m.matches.map((p) => (
                        <a
                          key={p.id}
                          href={`/properties/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-[#E0E0E0] rounded-xl px-3 py-2.5 hover:bg-[#F4F4F4] transition-colors"
                        >
                          <p className="text-sm font-semibold text-[#1E1E1E] leading-snug">
                            {p.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                            {p.location_text && (
                              <span className="text-xs text-[#666666]">{p.location_text}</span>
                            )}
                            {p.bedrooms != null && (
                              <span className="text-xs text-[#666666]">{p.bedrooms} bed</span>
                            )}
                            {p.size != null && (
                              <span className="text-xs text-[#666666]">{p.size} m²</span>
                            )}
                            {p.price != null && (
                              <span className="text-xs font-medium text-[#1E1E1E]">
                                €{p.price.toLocaleString()}
                              </span>
                            )}
                            {p.property_code && (
                              <span className="text-xs text-[#AAAAAA]">{p.property_code}</span>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Bot loading indicator */}
              {isLoadingBot && (
                <div className="flex justify-start">
                  <span className="text-sm px-3 py-2 rounded-xl bg-[#F2F2F2] text-[#AAAAAA] rounded-bl-sm select-none">
                    …
                  </span>
                </div>
              )}

              {/* Quick actions */}
              {!intent && !isLoadingBot && msgs.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.intent}
                      onClick={() => selectIntent(qa.intent, qa.label)}
                      className="text-left text-sm px-3 py-2.5 rounded-xl border border-[#E0E0E0] text-[#1E1E1E] hover:bg-[#F4F4F4] transition-colors"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Lead form */}
              {showForm && !submitted && (
                <div className="bg-[#F9F9F9] border border-[#E8E8E8] rounded-xl p-3 mt-2 space-y-2.5">
                  <div>
                    <input
                      type="text"
                      placeholder={s.namePlaceholder}
                      value={lead.name}
                      onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                      className="w-full text-sm border border-[#E0E0E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1E1E1E] bg-white"
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder={s.whatsappPlaceholder}
                      value={lead.whatsapp}
                      onChange={(e) => setLead((l) => ({ ...l, whatsapp: e.target.value }))}
                      className="w-full text-sm border border-[#E0E0E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1E1E1E] bg-white"
                    />
                    {errors.whatsapp && <p className="text-xs text-red-600 mt-1">{errors.whatsapp}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder={s.emailPlaceholder}
                      value={lead.email}
                      onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))}
                      className="w-full text-sm border border-[#E0E0E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1E1E1E] bg-white"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={s.notesPlaceholder}
                      value={lead.notes}
                      onChange={(e) => setLead((l) => ({ ...l, notes: e.target.value }))}
                      className="w-full text-sm border border-[#E0E0E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1E1E1E] bg-white"
                    />
                  </div>
                  <div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lead.consent_whatsapp}
                        onChange={(e) => setLead((l) => ({ ...l, consent_whatsapp: e.target.checked }))}
                        className="mt-0.5 shrink-0 accent-[#1E1E1E]"
                      />
                      <span className="text-xs text-[#555555] leading-snug">
                        {s.consentText}
                      </span>
                    </label>
                    {errors.consent_whatsapp && (
                      <p className="text-xs text-red-600 mt-1">{errors.consent_whatsapp}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50"
                  >
                    {submitting ? s.submittingLabel : s.submitLabel}
                  </button>
                </div>
              )}

              {/* Success state */}
              {submitted && (
                <div className="bg-[#F0FFF4] border border-[#86EFAC] rounded-xl p-4 mt-2 text-sm text-[#166534] leading-relaxed">
                  {s.successText}
                </div>
              )}

              <div ref={msgsEndRef} />
            </div>

            {/* ── Footer input row ── */}
            {!submitted && (
              <div className="bg-white border-t border-[#E8E8E8] px-3 py-2.5 flex flex-col gap-1.5 shrink-0">

                {/* Recording indicator / STT message */}
                {isRecording && (
                  <div className="flex items-center gap-1.5 px-1">
                    {/* Minimal red dot — no waveform, no animation */}
                    <span className="w-2 h-2 rounded-full bg-[#C1121F] shrink-0" aria-hidden="true" />
                    <span className="text-xs text-[#555555]">Listening…</span>
                  </div>
                )}
                {sttMessage && !isRecording && (
                  <p className="text-xs text-[#888888] px-1">{sttMessage}</p>
                )}

                {/* Voice language selector — shown only when STT is confirmed supported */}
                {sttSupported === true && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs text-[#AAAAAA] select-none">Voice:</span>
                    <select
                      value={sttLang}
                      onChange={(e) => handleLangChange(e.target.value as VoiceLangCode)}
                      disabled={isRecording}
                      aria-label="Voice input language"
                      className="text-xs text-[#555555] bg-transparent border-0 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                      {VOICE_LANGS.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Input + mic + send */}
                <div className="flex items-center gap-2">
                  {/* Text input — disabled during recording */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={isRecording ? "Listening…" : isLoadingBot ? "Waiting for response…" : "Type a message…"}
                    disabled={isRecording || isLoadingBot}
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1E1E1E] disabled:bg-[#F9F9F9] disabled:text-[#AAAAAA] disabled:cursor-default transition-colors"
                  />

                  {/* Mic button — shown only when STT is supported or still detecting */}
                  {sttSupported !== false && (
                    <button
                      onClick={handleMicToggle}
                      aria-label={isRecording ? "Stop recording" : "Start voice input"}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                        isRecording
                          ? "bg-[#C1121F] text-white hover:bg-[#a00f1a]"
                          : "bg-[#F4F4F4] text-[#555555] hover:bg-[#E8E8E8]"
                      }`}
                    >
                      {isRecording ? <StopIcon /> : <MicIcon />}
                    </button>
                  )}

                  {/* Send button — disabled during recording, loading, or empty input */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isRecording || isLoadingBot}
                    aria-label="Send"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1E1E1E] text-white hover:bg-[#333333] transition-colors disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="13" y1="1" x2="1" y2="13" />
                      <polyline points="1 1 13 1 13 13" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
