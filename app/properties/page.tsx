import { Suspense } from "react";
import type { Metadata } from "next";
import PropertiesClient from "./PropertiesClient";

export const metadata: Metadata = {
  title: "Properties for Sale in Greece | 1Choice",
  description:
    "Curated properties for sale in Greece. Apartments, villas, investment opportunities and Golden Visa eligible real estate.",
  alternates: {
    canonical: "/properties",
  },
  openGraph: {
    title: "Properties for Sale in Greece | 1Choice",
    description:
      "Curated properties for sale in Greece. Apartments, villas and investment real estate in Greece.",
    url: "https://1choice.gr/properties",
    siteName: "1Choice",
    type: "website",
  },
};

export default function PropertiesPage() {
  return (
    <Suspense>
      <PropertiesClient />
    </Suspense>
  );
}
