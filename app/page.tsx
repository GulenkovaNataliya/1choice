import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import FeaturedProperties from "@/components/Home/FeaturedProperties";
import WhyWorkWithUs from "@/components/Home/WhyWorkWithUs";
import InvestmentGoldenVisaTeaser from "@/components/Home/InvestmentGoldenVisaTeaser";
import Footer from "@/components/Layout/Footer";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <HorizontalFilter />
      <HomeNavButtons />
      <FeaturedProperties />
      <WhyWorkWithUs />
      <InvestmentGoldenVisaTeaser />
      <Footer />
    </>
  );
}
