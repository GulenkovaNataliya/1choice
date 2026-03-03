// ─── Type ──────────────────────────────────────────────────────────────────────
// Standalone — does not extend Property from mockFeatured.
// `area` and `cover_image` kept for existing UI components.

export type MockProperty = {
  // ── Identity ────────────────────────────────────────────────────────────────
  id:           number;
  slug:         string;
  title:        string;
  description:  string;
  area:         string;        // human-readable, e.g. "Glyfada, Athens Riviera"
  cover_image:  string | null;

  // ── Listing ─────────────────────────────────────────────────────────────────
  transaction: "buy" | "rent" | "antiparochi";
  type:        "apartment" | "maisonette" | "house" | "villa" | "land" | "commercial" | "investment";
  location:    string;         // slug from /components/Data/locations.ts
  price_eur:   number | null;

  // ── Details ─────────────────────────────────────────────────────────────────
  bedrooms:   number;
  bathrooms:  number;
  size_sqm:   number;
  year_built: number;          // 0 for land / pre-construction

  condition: "renovated" | "needsrenovation" | "underconstruction";
  features:  Array<"parking" | "pool" | "seaview" | "garden" | "furnished" | "investment">;

  // ── Flags ───────────────────────────────────────────────────────────────────
  is_golden_visa:  boolean;
  is_1choice_deal: boolean;

  created_at: string;          // ISO date YYYY-MM-DD
};

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const mockProperties: MockProperty[] = [
  // ── 1 ───────────────────────────────────────────────────────────────────────
  {
    id: 1, slug: "glyfada-seaside-apartment",
    title: "Seaside Apartment in Glyfada",
    description: "Bright two-bedroom apartment steps from the seafront with private parking and panoramic sea views. Ideal for year-round living or a holiday base on the Athens Riviera.",
    area: "Glyfada, Athens Riviera", cover_image: null,
    transaction: "buy", type: "apartment", location: "glyfada",
    price_eur: 480000,
    bedrooms: 2, bathrooms: 1, size_sqm: 85,  year_built: 2015,
    condition: "renovated", features: ["parking", "seaview"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-01-15",
  },

  // ── 2 ───────────────────────────────────────────────────────────────────────
  {
    id: 2, slug: "kifisia-villa-pine-garden",
    title: "Villa with Pine Garden in Kifisia",
    description: "Elegant five-bedroom villa set within a lush pine garden in one of Athens' most prestigious suburbs. Features a private pool, ample parking, and timeless architecture.",
    area: "Kifisia, North Athens", cover_image: null,
    transaction: "buy", type: "villa", location: "kifisia",
    price_eur: 1200000,
    bedrooms: 5, bathrooms: 3, size_sqm: 320, year_built: 2010,
    condition: "renovated", features: ["parking", "pool", "garden"],
    is_golden_visa: true,  is_1choice_deal: true,
    created_at: "2023-06-20",
  },

  // ── 3 ───────────────────────────────────────────────────────────────────────
  {
    id: 3, slug: "kolonaki-penthouse",
    title: "Penthouse in Kolonaki",
    description: "Three-bedroom penthouse crowning a boutique building in the heart of Kolonaki. Wraparound terraces with Acropolis and sea views; delivered fully renovated.",
    area: "Kolonaki, Central Athens", cover_image: null,
    transaction: "buy", type: "apartment", location: "kolonaki",
    price_eur: 950000,
    bedrooms: 3, bathrooms: 2, size_sqm: 150, year_built: 2018,
    condition: "renovated", features: ["seaview"],
    is_golden_visa: false, is_1choice_deal: true,
    created_at: "2024-03-01",
  },

  // ── 4 ───────────────────────────────────────────────────────────────────────
  {
    id: 4, slug: "piraeus-waterfront-flat",
    title: "Waterfront Flat in Piraeus",
    description: "Compact one-bedroom flat with direct sea views in the lively Piraeus port area. Priced to sell; renovation works required but all permits in order.",
    area: "Piraeus Port Area", cover_image: null,
    transaction: "buy", type: "apartment", location: "piraeus",
    price_eur: 310000,
    bedrooms: 1, bathrooms: 1, size_sqm: 55,  year_built: 2005,
    condition: "needsrenovation", features: ["seaview"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2023-11-10",
  },

  // ── 5 ───────────────────────────────────────────────────────────────────────
  {
    id: 5, slug: "santorini-cave-house",
    title: "Traditional Cave House in Santorini",
    description: "Authentic cave house carved into the caldera cliffs of Oia with sweeping sunset views. Fully renovated while preserving the original Cycladic character.",
    area: "Oia, Santorini", cover_image: null,
    transaction: "buy", type: "house", location: "santorini",
    price_eur: 780000,
    bedrooms: 2, bathrooms: 1, size_sqm: 90,  year_built: 1985,
    condition: "renovated", features: ["seaview"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2024-02-14",
  },

  // ── 6 ───────────────────────────────────────────────────────────────────────
  {
    id: 6, slug: "athens-center-maisonette",
    title: "Modern Maisonette in Athens Center",
    description: "Spacious three-bedroom maisonette in the heart of the city, fully furnished and move-in ready. Private garden terrace and covered parking make this a rare central find.",
    area: "Athens Center", cover_image: null,
    transaction: "buy", type: "maisonette", location: "athens-center",
    price_eur: 620000,
    bedrooms: 3, bathrooms: 2, size_sqm: 140, year_built: 2020,
    condition: "renovated", features: ["parking", "garden", "furnished"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-06-05",
  },

  // ── 7 ───────────────────────────────────────────────────────────────────────
  {
    id: 7, slug: "marousi-modern-apartment-rent",
    title: "Modern Apartment for Rent in Marousi",
    description: "Well-maintained two-bedroom apartment in a quiet residential street, close to metro and major business parks. Covered parking and immediate availability.",
    area: "Marousi, North Athens", cover_image: null,
    transaction: "rent", type: "apartment", location: "marousi",
    price_eur: 14400,
    bedrooms: 2, bathrooms: 1, size_sqm: 72,  year_built: 2008,
    condition: "renovated", features: ["parking"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2024-05-20",
  },

  // ── 8 ───────────────────────────────────────────────────────────────────────
  {
    id: 8, slug: "voula-beach-house",
    title: "Beach House in Voula",
    description: "Four-bedroom seafront villa with private pool and lush garden, just metres from the beach. Price on request — contact us for exclusive details.",
    area: "Voula, Athens Riviera", cover_image: null,
    transaction: "buy", type: "house", location: "voula",
    price_eur: null,
    bedrooms: 4, bathrooms: 2, size_sqm: 200, year_built: 2012,
    condition: "renovated", features: ["pool", "garden", "seaview"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-07-22",
  },

  // ── 9 ───────────────────────────────────────────────────────────────────────
  {
    id: 9, slug: "kolonaki-investment-floor",
    title: "Investment Building in Kolonaki",
    description: "Entire 800 sqm floor in a prime Kolonaki building, currently yielding 5.2% annually. Fully leased to corporate tenants; ideal for portfolio investment.",
    area: "Kolonaki, Central Athens", cover_image: null,
    transaction: "buy", type: "investment", location: "kolonaki",
    price_eur: 1500000,
    bedrooms: 0, bathrooms: 2, size_sqm: 800, year_built: 2000,
    condition: "renovated", features: ["parking", "investment"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2022-09-30",
  },

  // ── 10 ──────────────────────────────────────────────────────────────────────
  {
    id: 10, slug: "piraeus-commercial-space",
    title: "Commercial Space in Piraeus",
    description: "Ground-floor retail unit with direct street frontage, ideal for professional offices, showroom or retail. Two parking spaces included.",
    area: "Piraeus Port Area", cover_image: null,
    transaction: "buy", type: "commercial", location: "piraeus",
    price_eur: 380000,
    bedrooms: 0, bathrooms: 1, size_sqm: 120, year_built: 2008,
    condition: "renovated", features: ["parking"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2023-08-15",
  },

  // ── 11 ──────────────────────────────────────────────────────────────────────
  {
    id: 11, slug: "kifisia-land-plot",
    title: "Building Plot in Kifisia",
    description: "500 sqm residential plot in a sought-after Kifisia street with full planning permission for up to 350 sqm build. Suitable for luxury single-family villa.",
    area: "Kifisia, North Athens", cover_image: null,
    transaction: "buy", type: "land", location: "kifisia",
    price_eur: 350000,
    bedrooms: 0, bathrooms: 0, size_sqm: 500, year_built: 0,
    condition: "underconstruction", features: [],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2023-12-01",
  },

  // ── 12 ──────────────────────────────────────────────────────────────────────
  {
    id: 12, slug: "glyfada-family-apartment",
    title: "Family Apartment in Glyfada",
    description: "Three-bedroom apartment in a modern complex with communal pool, fully furnished and ready to move in. Walking distance to Glyfada's shops and beach.",
    area: "Glyfada, South Athens", cover_image: null,
    transaction: "buy", type: "apartment", location: "glyfada",
    price_eur: 550000,
    bedrooms: 3, bathrooms: 2, size_sqm: 125, year_built: 2016,
    condition: "renovated", features: ["parking", "pool", "furnished"],
    is_golden_visa: true,  is_1choice_deal: true,
    created_at: "2024-05-10",
  },

  // ── 13 ──────────────────────────────────────────────────────────────────────
  {
    id: 13, slug: "mykonos-town-villa",
    title: "Luxury Villa in Mykonos Town",
    description: "Magnificent five-bedroom villa perched above Mykonos Town with 180-degree sea views and infinity pool. Architect-designed interiors; a prestige acquisition.",
    area: "Mykonos Town, Mykonos", cover_image: null,
    transaction: "buy", type: "villa", location: "mykonos",
    price_eur: 2800000,
    bedrooms: 5, bathrooms: 4, size_sqm: 350, year_built: 2019,
    condition: "renovated", features: ["pool", "seaview", "parking"],
    is_golden_visa: true,  is_1choice_deal: true,
    created_at: "2024-04-18",
  },

  // ── 14 ──────────────────────────────────────────────────────────────────────
  {
    id: 14, slug: "rhodes-old-town-house",
    title: "Restored Stone House in Rhodes Old Town",
    description: "Three-bedroom house in the medieval heart of Rhodes, sensitively restored with modern finishes while honouring the original stone construction.",
    area: "Old Town, Rhodes", cover_image: null,
    transaction: "buy", type: "house", location: "rhodes",
    price_eur: 450000,
    bedrooms: 3, bathrooms: 2, size_sqm: 110, year_built: 1920,
    condition: "renovated", features: ["garden"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-01-28",
  },

  // ── 15 ──────────────────────────────────────────────────────────────────────
  {
    id: 15, slug: "vouliagmeni-luxury-apartment",
    title: "Luxury Apartment in Vouliagmeni",
    description: "Three-bedroom apartment in a prestigious Vouliagmeni complex offering direct sea views, infinity pool and secure parking. Finished to the highest specification.",
    area: "Vouliagmeni, Athens Riviera", cover_image: null,
    transaction: "buy", type: "apartment", location: "vouliagmeni",
    price_eur: 890000,
    bedrooms: 3, bathrooms: 2, size_sqm: 130, year_built: 2021,
    condition: "renovated", features: ["seaview", "parking", "pool"],
    is_golden_visa: true,  is_1choice_deal: true,
    created_at: "2024-08-05",
  },

  // ── 16 ──────────────────────────────────────────────────────────────────────
  {
    id: 16, slug: "athens-center-antiparochi-maisonette",
    title: "Antiparochi Maisonette — Athens Center",
    description: "New-build four-bedroom maisonette offered under antiparochi terms in a prime central location. Delivery 2026; layout customisation available at this stage.",
    area: "Athens Center", cover_image: null,
    transaction: "antiparochi", type: "maisonette", location: "athens-center",
    price_eur: null,
    bedrooms: 4, bathrooms: 2, size_sqm: 160, year_built: 0,
    condition: "underconstruction", features: ["parking"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2024-09-12",
  },

  // ── 17 ──────────────────────────────────────────────────────────────────────
  {
    id: 17, slug: "corfu-hillside-villa-rent",
    title: "Hillside Villa for Rent in Corfu",
    description: "Beautifully furnished four-bedroom villa with pool, sea views and mature garden, available for long-term rental. Peaceful setting yet minutes from Corfu Town.",
    area: "Corfu, Ionian Islands", cover_image: null,
    transaction: "rent", type: "villa", location: "corfu",
    price_eur: 36000,
    bedrooms: 4, bathrooms: 3, size_sqm: 220, year_built: 2005,
    condition: "renovated", features: ["pool", "seaview", "garden"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2023-07-14",
  },

  // ── 18 ──────────────────────────────────────────────────────────────────────
  {
    id: 18, slug: "paros-cycladic-house",
    title: "Cycladic House in Naoussa, Paros",
    description: "Three-bedroom house in traditional Cycladic style with private garden and sea glimpses, a five-minute walk from Naoussa harbour.",
    area: "Naoussa, Paros", cover_image: null,
    transaction: "buy", type: "house", location: "paros",
    price_eur: 520000,
    bedrooms: 3, bathrooms: 2, size_sqm: 105, year_built: 2014,
    condition: "renovated", features: ["seaview", "garden"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-03-22",
  },

  // ── 19 ──────────────────────────────────────────────────────────────────────
  {
    id: 19, slug: "marousi-commercial-office",
    title: "Commercial Office Building in Marousi",
    description: "250 sqm ground-floor commercial premises on a high-footfall Marousi street, suited to offices, medical or wellness use. Two parking spaces included.",
    area: "Marousi, North Athens", cover_image: null,
    transaction: "buy", type: "commercial", location: "marousi",
    price_eur: 680000,
    bedrooms: 0, bathrooms: 2, size_sqm: 250, year_built: 2011,
    condition: "renovated", features: ["parking", "investment"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2023-10-08",
  },

  // ── 20 ──────────────────────────────────────────────────────────────────────
  {
    id: 20, slug: "kifisia-family-maisonette",
    title: "Family Maisonette in Kifisia",
    description: "Four-bedroom maisonette with a landscaped private garden in one of Kifisia's most desirable streets. Top-quality finishes throughout; parking for two vehicles.",
    area: "Kifisia, North Athens", cover_image: null,
    transaction: "buy", type: "maisonette", location: "kifisia",
    price_eur: 750000,
    bedrooms: 4, bathrooms: 3, size_sqm: 185, year_built: 2017,
    condition: "renovated", features: ["parking", "garden"],
    is_golden_visa: true,  is_1choice_deal: false,
    created_at: "2024-02-09",
  },

  // ── 21 ──────────────────────────────────────────────────────────────────────
  {
    id: 21, slug: "crete-land-plot",
    title: "Land Plot near Heraklion, Crete",
    description: "800 sqm plot with sea-view potential on the outskirts of Heraklion, zoned for residential construction. Suitable for a holiday villa or investment development.",
    area: "Heraklion, Crete", cover_image: null,
    transaction: "buy", type: "land", location: "crete",
    price_eur: 280000,
    bedrooms: 0, bathrooms: 0, size_sqm: 800, year_built: 0,
    condition: "underconstruction", features: [],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2023-05-30",
  },

  // ── 22 ──────────────────────────────────────────────────────────────────────
  {
    id: 22, slug: "nea-smyrni-apartment-rent",
    title: "Central Apartment for Rent in Nea Smyrni",
    description: "Renovated two-bedroom apartment on a tree-lined street in Nea Smyrni, fully furnished and available immediately. Close to the main square and metro.",
    area: "Nea Smyrni, South Athens", cover_image: null,
    transaction: "rent", type: "apartment", location: "nea-smyrni",
    price_eur: 16800,
    bedrooms: 2, bathrooms: 1, size_sqm: 78,  year_built: 2003,
    condition: "renovated", features: ["furnished"],
    is_golden_visa: false, is_1choice_deal: false,
    created_at: "2024-10-01",
  },
];
