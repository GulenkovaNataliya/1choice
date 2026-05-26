import HeroVideo from "@/components/HeroVideo";
import AvatarGuideBlock from "@/components/AI/AvatarGuideBlock";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import PopularAreaLinks from "@/components/Locations/PopularAreaLinks";
import Footer from "@/components/Layout/Footer";
import { fetchActiveAreas } from "@/lib/areas";
import { fetchSettings } from "@/lib/settings/fetchSettings";

export default async function HomePage() {
  const [areas, settings] = await Promise.all([fetchActiveAreas(), fetchSettings()]);

  return (
    <>
      <HeroVideo />
      <AvatarGuideBlock
        variant="home"
        videoSrc="/video/ai-guide/home.mp4"
        posterSrc="/video/ai-guide/avatar-poster.webp"
        title="Your AI guide to real estate in Greece"
        body="Meet 1Choice AI Guide — a premium digital guide that introduces the platform and connects visitors to 1Choice Property Advisor."
        ctaLabel="Talk to 1Choice Property Advisor"
        intent="general_question"
        className="bg-white"
      />
      <HorizontalFilter areas={areas} />
      <HomeNavButtons />
      <PopularAreaLinks title="Explore properties by area" />
      <Footer companyName={settings.company_name ?? undefined} />
    </>
  );
}
