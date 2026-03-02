const CARDS = [
  { num: "01", title: "Company Reliability", sub: "Over a decade of verified transactions in the Greek market." },
  { num: "02", title: "100% Legal Process", sub: "Every deal is fully documented and compliant with Greek law." },
  { num: "03", title: "No Risk", sub: "We verify ownership, permits, and encumbrances before you commit." },
  { num: "04", title: "Personal Attention", sub: "A dedicated advisor for each client — no handoffs, no call centres." },
  { num: "05", title: "Right Choice", sub: "We present only properties that match your criteria." },
];

export default function WhyWorkWithUs() {
  return (
    <section
      data-testid="whyWorkWithUsSection"
      style={{ backgroundColor: "#1E1E1E", width: "100%" }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "56px 24px 64px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#F4F4F4",
            margin: "0 0 40px",
          }}
        >
          Why Work With Us
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 24,
          }}
          className="why-grid"
        >
          {CARDS.map(({ num, title, sub }) => (
            <div
              key={num}
              data-testid={`whyCard-${num}`}
              style={{
                border: "1px solid #404040",
                borderRadius: 16,
                padding: "24px 22px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#606060";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#404040";
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#C1121F",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.04em",
                }}
              >
                {num}
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#F4F4F4",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#D9D9D9",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .why-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .why-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
