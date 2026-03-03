export type LocationGroup = "Athens" | "Attica" | "Islands";

export type Location = {
  label: string;
  slug:  string;
  group: LocationGroup;
};

export const LOCATION_GROUPS: LocationGroup[] = ["Athens", "Attica", "Islands"];

export const LOCATIONS: Location[] = [
  // ── Athens ──────────────────────────────────────────────────────────────────
  { label: "Athens Center",  slug: "athens-center",  group: "Athens" },
  { label: "Kolonaki",       slug: "kolonaki",        group: "Athens" },
  { label: "Koukaki",        slug: "koukaki",         group: "Athens" },
  { label: "Pangrati",       slug: "pangrati",        group: "Athens" },
  { label: "Exarchia",       slug: "exarchia",        group: "Athens" },
  { label: "Glyfada",        slug: "glyfada",         group: "Athens" },
  { label: "Voula",          slug: "voula",           group: "Athens" },
  { label: "Vouliagmeni",    slug: "vouliagmeni",     group: "Athens" },
  { label: "Elliniko",       slug: "elliniko",        group: "Athens" },
  { label: "Alimos",         slug: "alimos",          group: "Athens" },
  { label: "Marousi",        slug: "marousi",         group: "Athens" },
  { label: "Kifisia",        slug: "kifisia",         group: "Athens" },
  { label: "Nea Smyrni",     slug: "nea-smyrni",      group: "Athens" },
  { label: "Piraeus",        slug: "piraeus",         group: "Athens" },

  // ── Attica ──────────────────────────────────────────────────────────────────
  { label: "Rafina",         slug: "rafina",          group: "Attica" },
  { label: "Porto Rafti",    slug: "porto-rafti",     group: "Attica" },
  { label: "Lavrio",         slug: "lavrio",          group: "Attica" },
  { label: "Sounio",         slug: "sounio",          group: "Attica" },
  { label: "Anavyssos",      slug: "anavyssos",       group: "Attica" },
  { label: "Artemida",       slug: "artemida",        group: "Attica" },

  // ── Islands ─────────────────────────────────────────────────────────────────
  { label: "Zakynthos",      slug: "zakynthos",       group: "Islands" },
  { label: "Corfu",          slug: "corfu",           group: "Islands" },
  { label: "Crete",          slug: "crete",           group: "Islands" },
  { label: "Chania",         slug: "chania",          group: "Islands" },
  { label: "Mykonos",        slug: "mykonos",         group: "Islands" },
  { label: "Santorini",      slug: "santorini",       group: "Islands" },
  { label: "Paros",          slug: "paros",           group: "Islands" },
  { label: "Naxos",          slug: "naxos",           group: "Islands" },
  { label: "Rhodes",         slug: "rhodes",          group: "Islands" },
  { label: "Lefkada",        slug: "lefkada",         group: "Islands" },
];
