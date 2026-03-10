import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import Footer from "@/components/Layout/Footer";
import { fetchActiveAreas } from "@/lib/areas";

export default async function HomePage() {
  const areas = await fetchActiveAreas();

  return (
    <>
      <HeroVideo />
      <HorizontalFilter areas={areas} />
      <HomeNavButtons />
      <Footer />
    </>
  );
}
