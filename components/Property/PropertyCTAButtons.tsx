"use client";

export default function PropertyCTAButtons() {
  function openChat(intent: string, label: string) {
    window.dispatchEvent(
      new CustomEvent("1choice:open-chat", { detail: { intent, label } })
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => openChat("viewing_request", "Request Viewing")}
        className="w-full py-3 rounded-xl bg-[#3A2E4F] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Request Viewing
      </button>
      <button
        type="button"
        onClick={() => openChat("general_question", "Contact Advisor")}
        className="w-full py-3 rounded-xl border border-[#1E1E1E] text-[#1E1E1E] bg-white font-medium text-sm hover:bg-[#F4F4F4] transition-colors"
      >
        Contact Advisor
      </button>
    </div>
  );
}
