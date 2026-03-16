export type LocationSeoEntry = {
  slug: string;
  name: string;
  subtitle: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
};

export const LOCATION_SEO_CONFIG: Record<string, LocationSeoEntry> = {
  athens: {
    slug: "athens",
    name: "Athens",
    subtitle: "Properties for sale and rent in the Greek capital",
    intro:
      "Athens combines world-class culture, a vibrant city lifestyle, and a growing real estate market. " +
      "From elegant apartments in the historic centre to modern residences in leafy northern suburbs, " +
      "1Choice curates only the most relevant properties to match your goals — whether buying to live, invest, or qualify for the Greek Golden Visa.",
    metaTitle: "Properties in Athens | 1Choice",
    metaDescription:
      "Browse curated properties for sale and rent in Athens, Greece. Apartments, villas, and investment opportunities hand-picked by 1Choice.",
  },

  glyfada: {
    slug: "glyfada",
    name: "Glyfada",
    subtitle: "Upscale living on the Athens Riviera",
    intro:
      "Glyfada is one of the most desirable addresses on the Athens Riviera — a coastal suburb known for its " +
      "high-end boutiques, marinas, golf club, and easy airport access. Properties here range from sea-view " +
      "apartments to spacious villas, making it a top choice for both primary residences and high-yield investments.",
    metaTitle: "Properties in Glyfada | 1Choice",
    metaDescription:
      "Discover curated properties in Glyfada, Athens Riviera. Sea-view apartments, villas, and investment properties selected by 1Choice.",
  },

  "athens-center": {
    slug: "athens-center",
    name: "Athens Center",
    subtitle: "Urban living at the heart of Greece",
    intro:
      "Athens Center places you steps from Syntagma Square, the Acropolis, and the city's best restaurants " +
      "and cultural venues. A hotspot for short-term rental investment and urban pied-à-terre buyers, " +
      "central Athens offers a diverse mix of renovated neoclassicals, modern apartments, and boutique buildings.",
    metaTitle: "Properties in Athens Center | 1Choice",
    metaDescription:
      "Find properties in central Athens — apartments, renovated neoclassicals, and investment opportunities in the heart of the Greek capital.",
  },

  voula: {
    slug: "voula",
    name: "Voula",
    subtitle: "Quiet coastal living south of Athens",
    intro:
      "Voula offers a relaxed, residential alternative to its busier neighbour Glyfada — with tree-lined streets, " +
      "beach access, and a strong sense of community. It attracts families and professionals looking for " +
      "quality of life within 20 minutes of central Athens. Properties here are typically spacious, " +
      "with a mix of detached homes, villas, and contemporary apartments.",
    metaTitle: "Properties in Voula | 1Choice",
    metaDescription:
      "Browse curated properties in Voula, south Athens. Family homes, villas, and apartments in a peaceful coastal setting.",
  },

  piraeus: {
    slug: "piraeus",
    name: "Piraeus",
    subtitle: "Harbour city regeneration and waterfront living",
    intro:
      "Piraeus is undergoing significant urban regeneration, driven by major infrastructure investment and " +
      "its role as Europe's fastest-growing port. The waterfront areas offer strong rental yields and " +
      "attractive entry-level investment opportunities — particularly relevant for Golden Visa applicants " +
      "and buy-to-let investors looking for long-term appreciation.",
    metaTitle: "Properties in Piraeus | 1Choice",
    metaDescription:
      "Explore properties in Piraeus — waterfront apartments and investment opportunities in one of Greece's most dynamic regeneration areas.",
  },
};

export const LOCATION_SLUGS = Object.keys(LOCATION_SEO_CONFIG) as Array<
  keyof typeof LOCATION_SEO_CONFIG
>;
