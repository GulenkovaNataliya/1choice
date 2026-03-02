export type Property = {
  id: string;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  cover_image: string | null;
  is_vip: boolean;
};

export const mockFeatured: Property[] = [
  {
    id: "1",
    slug: "glyfada-seaside-apartment",
    title: "Seaside Apartment in Glyfada",
    area: "Glyfada, Athens Riviera",
    price_eur: 480000,
    is_golden_visa: true,
    is_1choice_deal: false,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "2",
    slug: "kifisia-villa-pine",
    title: "Villa with Pine Garden in Kifisia",
    area: "Kifisia, North Athens",
    price_eur: 1200000,
    is_golden_visa: true,
    is_1choice_deal: true,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "3",
    slug: "kolonaki-penthouse",
    title: "Penthouse in Kolonaki",
    area: "Kolonaki, Central Athens",
    price_eur: 950000,
    is_golden_visa: false,
    is_1choice_deal: true,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "4",
    slug: "piraeus-waterfront-flat",
    title: "Waterfront Flat in Piraeus",
    area: "Piraeus Port Area",
    price_eur: 310000,
    is_golden_visa: true,
    is_1choice_deal: false,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "5",
    slug: "santorini-cave-house",
    title: "Traditional Cave House in Santorini",
    area: "Oia, Santorini",
    price_eur: 780000,
    is_golden_visa: false,
    is_1choice_deal: false,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "6",
    slug: "paleo-faliro-apartment",
    title: "Modern Apartment in Paleo Faliro",
    area: "Paleo Faliro, South Athens",
    price_eur: 260000,
    is_golden_visa: true,
    is_1choice_deal: true,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "7",
    slug: "thessaloniki-city-center",
    title: "City Centre Apartment in Thessaloniki",
    area: "Centre, Thessaloniki",
    price_eur: 195000,
    is_golden_visa: false,
    is_1choice_deal: false,
    cover_image: null,
    is_vip: false,
  },
  {
    id: "8",
    slug: "voula-beach-house",
    title: "Beach House in Voula",
    area: "Voula, Athens Riviera",
    price_eur: null,
    is_golden_visa: true,
    is_1choice_deal: false,
    cover_image: null,
    is_vip: false,
  },
];
