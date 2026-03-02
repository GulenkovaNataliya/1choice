import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import FeaturedProperties from "@/components/Home/FeaturedProperties";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <HorizontalFilter />
      <HomeNavButtons />
      <FeaturedProperties />
    </>
  );
}
