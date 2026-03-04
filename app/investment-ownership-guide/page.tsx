import AccordionClient from "./AccordionClient";

const COLUMNS = [
  {
    title: "Acquisition",
    items: [
      {
        question: "Can foreigners buy property in Greece?",
        answer:
          "Foreign citizens are allowed to purchase property in Greece. In most regions there are no restrictions, although certain border areas may require additional approval. A Greek tax number (AFM) and legal representation are typically required during the purchase process.",
      },
      {
        question: "What are the basic steps of purchasing property?",
        answer:
          "The typical process includes:\n1) Property selection\n2) Legal due diligence\n3) Obtaining a Greek tax number (AFM)\n4) Opening a Greek bank account\n5) Signing the purchase contract before a notary\n6) Registration of the property in the Land Registry",
      },
      {
        question: "What additional costs should buyers expect?",
        answer:
          "In addition to the property price, buyers should consider:\n- Property transfer tax\n- Notary fees\n- Legal fees\n- Land registry fees\n- Possible renovation costs\nThese costs usually represent a percentage of the purchase price.",
      },
      {
        question: "Is legal due diligence necessary?",
        answer:
          "Yes. A legal review helps confirm ownership, ensure there are no encumbrances on the property, and verify building permits and zoning compliance.",
      },
    ],
  },
  {
    title: "Rental",
    items: [
      {
        question: "Can property in Greece be rented to tourists?",
        answer:
          "Yes. Short-term rentals are permitted in Greece under specific regulations. Owners may need to register the property in the official short-term rental registry and comply with local tax reporting requirements.",
      },
      {
        question: "What types of rental income exist?",
        answer:
          "Two main rental models are common:\n- Long-term residential rental\n- Short-term tourist rental\nEach model has different taxation rules and management requirements.",
      },
      {
        question: "Do I need a property manager?",
        answer:
          "Many foreign investors choose to work with local property management companies that handle bookings, maintenance, and guest communication.",
      },
      {
        question: "How is rental income taxed?",
        answer:
          "Rental income is taxed under Greek income tax rules. Tax rates may vary depending on the amount of income and the ownership structure.",
      },
    ],
  },
  {
    title: "Antiparochi",
    items: [
      {
        question: "What is Antiparochi?",
        answer:
          "Antiparochi is a traditional Greek development model where a landowner provides land to a developer in exchange for a portion of the newly constructed apartments or units.",
      },
      {
        question: "How does the process work?",
        answer:
          "The developer finances and builds the project. After completion, the agreed share of the property is transferred to the landowner.",
      },
      {
        question: "Why is Antiparochi attractive to investors?",
        answer:
          "It allows development without the landowner directly financing the construction while sharing in the value of the completed project.",
      },
      {
        question: "Is legal support required?",
        answer:
          "Yes. Agreements between landowners and developers must be carefully structured and registered to protect the interests of all parties.",
      },
    ],
  },
];

export default function InvestmentGuidePage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Hero */}
      <section className="bg-[#3A2E4F] px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Investment &amp; Ownership Guide
        </h1>
        <p className="text-[#D9D9D9] text-lg whitespace-nowrap">
          Practical guidance for buying, owning, renting and developing property in Greece.
        </p>
      </section>

      {/* 3-column accordion */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xl font-semibold text-[#1E1E1E] mb-4">{col.title}</h2>
              <AccordionClient items={col.items} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#1E1E1E] mb-6">
          Need help choosing the right investment strategy?
        </h2>
        {/* TODO: wire to chat/advisory system when available */}
        <button
          type="button"
          disabled
          className="bg-[#3A2E4F] text-[#D9D9D9] px-8 py-4 rounded-xl font-medium opacity-50 cursor-default pointer-events-none"
        >
          Start Advisory Consultation
        </button>
      </section>
    </main>
  );
}
