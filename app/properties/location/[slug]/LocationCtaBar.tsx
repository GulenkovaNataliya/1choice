"use client";

type Props = { locationName: string };

export default function LocationCtaBar({ locationName }: Props) {
  function openChat(intent: "viewing_request" | "general_question") {
    window.dispatchEvent(
      new CustomEvent("1choice:open-chat", {
        detail: {
          intent,
          label:
            intent === "viewing_request"
              ? `Request Viewing — area: ${locationName}`
              : `Contact Advisor — area: ${locationName}`,
        },
      })
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={() => openChat("viewing_request")}
        className="px-6 py-3 rounded-xl bg-[#3A2E4F] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Request Viewing
      </button>
      <button
        type="button"
        onClick={() => openChat("general_question")}
        className="px-6 py-3 rounded-xl border border-[#1E1E1E] text-[#1E1E1E] bg-white text-sm font-medium hover:bg-[#F4F4F4] transition-colors whitespace-nowrap"
      >
        Ask an Advisor
      </button>
    </div>
  );
}
