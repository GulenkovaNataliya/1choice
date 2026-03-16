import type { Metadata } from "next";
import SavedPropertiesClient from "./SavedPropertiesClient";

export const metadata: Metadata = {
  title: "Saved Properties | 1Choice",
  robots: { index: false },
};

export default function SavedPage() {
  return <SavedPropertiesClient />;
}
