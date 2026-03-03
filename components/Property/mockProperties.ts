import type { Property } from "./mockFeatured";

// Extends the base Property type with all filterable fields
export type MockProperty = Property & {
  transaction: string;   // "buy" | "rent" | "antiparochi"
  type: string;          // "apartment" | "maisonette" | "house" | "villa" | "land" | "commercial" | "investment"
  location: string;      // slug: "glyfada" | "kifisia" | "kolonaki" | "piraeus" | "santorini" | "thessaloniki" | "athens-centre"
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  year_built: number;    // 0 for land/unbuilt
  features: string[];    // slugs: "parking" | "pool" | "seaview" | "garden" | "furnished" | "investment"
  condition: string;     // "renovated" | "needsrenovation" | "underconstruction"
  created_at: string;    // ISO date string YYYY-MM-DD — used for "Newest" sort
};

export const mockProperties: MockProperty[] = [
  {
    id: "1", slug: "glyfada-seaside-apartment",
    title: "Seaside Apartment in Glyfada", area: "Glyfada, Athens Riviera",
    price_eur: 480000, is_golden_visa: true, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "apartment", location: "glyfada",
    bedrooms: 2, bathrooms: 1, size_sqm: 85, year_built: 2015,
    features: ["parking", "seaview"], condition: "renovated", created_at: "2024-01-15",
  },
  {
    id: "2", slug: "kifisia-villa-pine",
    title: "Villa with Pine Garden in Kifisia", area: "Kifisia, North Athens",
    price_eur: 1200000, is_golden_visa: true, is_1choice_deal: true, cover_image: null, is_vip: false,
    transaction: "buy", type: "villa", location: "kifisia",
    bedrooms: 5, bathrooms: 3, size_sqm: 320, year_built: 2010,
    features: ["parking", "pool", "garden"], condition: "renovated", created_at: "2023-06-20",
  },
  {
    id: "3", slug: "kolonaki-penthouse",
    title: "Penthouse in Kolonaki", area: "Kolonaki, Central Athens",
    price_eur: 950000, is_golden_visa: false, is_1choice_deal: true, cover_image: null, is_vip: false,
    transaction: "buy", type: "apartment", location: "kolonaki",
    bedrooms: 3, bathrooms: 2, size_sqm: 150, year_built: 2018,
    features: ["seaview"], condition: "renovated", created_at: "2024-03-01",
  },
  {
    id: "4", slug: "piraeus-waterfront-flat",
    title: "Waterfront Flat in Piraeus", area: "Piraeus Port Area",
    price_eur: 310000, is_golden_visa: true, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "apartment", location: "piraeus",
    bedrooms: 1, bathrooms: 1, size_sqm: 55, year_built: 2005,
    features: ["seaview"], condition: "needsrenovation", created_at: "2023-11-10",
  },
  {
    id: "5", slug: "santorini-cave-house",
    title: "Traditional Cave House in Santorini", area: "Oia, Santorini",
    price_eur: 780000, is_golden_visa: false, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "house", location: "santorini",
    bedrooms: 2, bathrooms: 1, size_sqm: 90, year_built: 1985,
    features: ["seaview"], condition: "renovated", created_at: "2024-02-14",
  },
  {
    id: "6", slug: "athens-centre-maisonette",
    title: "Modern Maisonette in Athens Centre", area: "Athens Centre",
    price_eur: 620000, is_golden_visa: true, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "maisonette", location: "athens-centre",
    bedrooms: 3, bathrooms: 2, size_sqm: 140, year_built: 2020,
    features: ["parking", "garden", "furnished"], condition: "renovated", created_at: "2024-06-05",
  },
  {
    id: "7", slug: "thessaloniki-city-center",
    title: "City Centre Apartment in Thessaloniki", area: "Centre, Thessaloniki",
    price_eur: 195000, is_golden_visa: false, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "rent", type: "apartment", location: "thessaloniki",
    bedrooms: 1, bathrooms: 1, size_sqm: 50, year_built: 1990,
    features: [], condition: "renovated", created_at: "2023-04-18",
  },
  {
    id: "8", slug: "voula-beach-house",
    title: "Beach House in Voula", area: "Voula, Athens Riviera",
    price_eur: null, is_golden_visa: true, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "house", location: "glyfada",
    bedrooms: 4, bathrooms: 2, size_sqm: 200, year_built: 2012,
    features: ["pool", "garden", "seaview"], condition: "renovated", created_at: "2024-07-22",
  },
  {
    id: "9", slug: "kolonaki-investment-floor",
    title: "Investment Floor in Kolonaki", area: "Kolonaki, Central Athens",
    price_eur: 1500000, is_golden_visa: true, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "investment", location: "kolonaki",
    bedrooms: 0, bathrooms: 2, size_sqm: 800, year_built: 2000,
    features: ["parking"], condition: "renovated", created_at: "2022-09-30",
  },
  {
    id: "10", slug: "piraeus-commercial-space",
    title: "Commercial Space in Piraeus", area: "Piraeus Port Area",
    price_eur: 380000, is_golden_visa: false, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "commercial", location: "piraeus",
    bedrooms: 0, bathrooms: 1, size_sqm: 120, year_built: 2008,
    features: ["parking"], condition: "renovated", created_at: "2023-08-15",
  },
  {
    id: "11", slug: "kifisia-land-plot",
    title: "Land Plot in Kifisia", area: "Kifisia, North Athens",
    price_eur: 350000, is_golden_visa: false, is_1choice_deal: false, cover_image: null, is_vip: false,
    transaction: "buy", type: "land", location: "kifisia",
    bedrooms: 0, bathrooms: 0, size_sqm: 500, year_built: 0,
    features: [], condition: "underconstruction", created_at: "2023-12-01",
  },
  {
    id: "12", slug: "glyfada-family-apartment",
    title: "Family Apartment in Glyfada", area: "Glyfada, South Athens",
    price_eur: 550000, is_golden_visa: true, is_1choice_deal: true, cover_image: null, is_vip: false,
    transaction: "buy", type: "apartment", location: "glyfada",
    bedrooms: 3, bathrooms: 2, size_sqm: 125, year_built: 2016,
    features: ["parking", "pool", "furnished"], condition: "renovated", created_at: "2024-05-10",
  },
];
