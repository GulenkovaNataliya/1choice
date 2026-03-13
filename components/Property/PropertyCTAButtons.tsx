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
        onClick={() => openChat("property_inquiry", "Property Inquiry")}
        className="w-full py-3 rounded-xl bg-[#1E1E1E] text-[#C1121F] font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Start a Conversation
      </button>
      <button
        type="button"
        onClick={() => openChat("property_viewing", "Schedule Viewing")}
        className="w-full py-3 rounded-xl bg-[#3A2E4F] text-[#D9D9D9] font-medium text-sm hover:opacity-90 transition-opacity"
      >
        Schedule Viewing
      </button>
    </div>
  );
}
