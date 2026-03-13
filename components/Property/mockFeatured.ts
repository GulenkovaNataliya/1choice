export type Property = {
  id: string;
  property_code: string | null;
  slug: string;
  title: string;
  area: string;
  price_eur: number | null;
  is_golden_visa: boolean;
  is_1choice_deal: boolean;
  featured: boolean;
  private_collection: boolean;
  cover_image_url: string | null;
  gallery_image_urls: string[];
};

export const mockFeatured: Property[] = [
  {
    id: "1",
    property_code: null,
    slug: "glyfada-seaside-apartment",
    title: "Seaside Apartment in Glyfada",
    area: "Glyfada, Athens Riviera",
    price_eur: 480000,
    is_golden_visa: true,
    is_1choice_deal: false,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "2",
    property_code: null,
    slug: "kifisia-villa-pine",
    title: "Villa with Pine Garden in Kifisia",
    area: "Kifisia, North Athens",
    price_eur: 1200000,
    is_golden_visa: true,
    is_1choice_deal: true,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "3",
    property_code: null,
    slug: "kolonaki-penthouse",
    title: "Penthouse in Kolonaki",
    area: "Kolonaki, Central Athens",
    price_eur: 950000,
    is_golden_visa: false,
    is_1choice_deal: true,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "4",
    property_code: null,
    slug: "piraeus-waterfront-flat",
    title: "Waterfront Flat in Piraeus",
    area: "Piraeus Port Area",
    price_eur: 310000,
    is_golden_visa: true,
    is_1choice_deal: false,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "5",
    property_code: null,
    slug: "santorini-cave-house",
    title: "Traditional Cave House in Santorini",
    area: "Oia, Santorini",
    price_eur: 780000,
    is_golden_visa: false,
    is_1choice_deal: false,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "6",
    property_code: null,
    slug: "paleo-faliro-apartment",
    title: "Modern Apartment in Paleo Faliro",
    area: "Paleo Faliro, South Athens",
    price_eur: 260000,
    is_golden_visa: true,
    is_1choice_deal: true,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "7",
    property_code: null,
    slug: "thessaloniki-city-center",
    title: "City Centre Apartment in Thessaloniki",
    area: "Centre, Thessaloniki",
    price_eur: 195000,
    is_golden_visa: false,
    is_1choice_deal: false,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
  {
    id: "8",
    property_code: null,
    slug: "voula-beach-house",
    title: "Beach House in Voula",
    area: "Voula, Athens Riviera",
    price_eur: null,
    is_golden_visa: true,
    is_1choice_deal: false,
    featured: false,
    private_collection: false,
    cover_image_url: null,
    gallery_image_urls: [],
  },
];
