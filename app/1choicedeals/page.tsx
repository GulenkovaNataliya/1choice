import type { Metadata } from "next";
import DealsGrid from "./DealsGrid";

export const metadata: Metadata = {
  title: "1ChoiceDeals | 1Choice Real Estate",
  description: "A curated selection of properties with verified value and direct pricing in Greece.",
};

export default function OneChoiceDealsPage() {
  return (
    <main style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1E1E1E",
            margin: "0 0 12px",
          }}
        >
          1ChoiceDeals
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#404040",
            margin: "0 0 40px",
            lineHeight: 1.5,
          }}
        >
          A curated selection of properties with verified value and direct pricing.
        </p>

        <DealsGrid />
      </div>
    </main>
  );
}
