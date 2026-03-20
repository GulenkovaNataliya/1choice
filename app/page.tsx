import HeroVideo from "@/components/HeroVideo";
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
      <HorizontalFilter areas={areas} />
      <HomeNavButtons />
      <PopularAreaLinks title="Explore properties by area" />
      <Footer companyName={settings.company_name ?? undefined} />
    </>
  );
}
