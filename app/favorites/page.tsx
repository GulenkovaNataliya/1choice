import type { Metadata } from "next";
import SavedPropertiesClient from "@/app/saved/SavedPropertiesClient";

export const metadata: Metadata = {
  title: "Saved Properties | 1Choice",
  robots: { index: false },
};

export default function FavoritesPage() {
  return <SavedPropertiesClient />;
}
