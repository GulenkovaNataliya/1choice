"use client";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function InvestmentGuideCTAButton({ className, children }: Props) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent("1choice:open-chat", {
        detail: { intent: "investment_strategy", label: "Investment Strategy" },
      })
    );
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
