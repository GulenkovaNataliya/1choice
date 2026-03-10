"use client";

/**
 * GoldenVisaCTAButton
 *
 * Renders a styled CTA button that opens the chatbot directly in the
 * golden_visa intent by dispatching a custom DOM event.
 *
 * The floating chat button is intentionally hidden on /golden-visa-greece
 * (not in the visibility whitelist in ChatWidget). This component is the
 * only entry point to the chatbot on that page.
 */

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function GoldenVisaCTAButton({ className, children }: Props) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent("1choice:open-chat", {
        detail: { intent: "golden_visa", label: "Golden Visa" },
      })
    );
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
