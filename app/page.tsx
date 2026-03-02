import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import Footer from "@/components/Layout/Footer";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <HorizontalFilter />
      <HomeNavButtons />
      <Footer />
    </>
  );
}
