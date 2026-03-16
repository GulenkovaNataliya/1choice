import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "Compare Properties | 1Choice",
  robots: { index: false },
};

export default function ComparePage() {
  return <CompareClient />;
}
