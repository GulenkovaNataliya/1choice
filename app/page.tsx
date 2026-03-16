import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import PopularAreaLinks from "@/components/Locations/PopularAreaLinks";
import Footer from "@/components/Layout/Footer";
import { fetchActiveAreas } from "@/lib/areas";

export default async function HomePage() {
  const areas = await fetchActiveAreas();

  return (
    <>
      <HeroVideo />
      <HorizontalFilter areas={areas} />
      <HomeNavButtons />
      <PopularAreaLinks title="Explore properties by area" />
      <Footer />
    </>
  );
}
