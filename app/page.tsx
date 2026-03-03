import HeroVideo from "@/components/HeroVideo";
import HorizontalFilter from "@/components/Home/HorizontalFilter";
import HomeNavButtons from "@/components/Home/HomeNavButtons";
import Footer from "@/components/Layout/Footer";
import SupabaseCheck from "@/components/Dev/SupabaseCheck";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <HorizontalFilter />
      <HomeNavButtons />
      <Footer />
      <SupabaseCheck />
      <div style={{position:'fixed',bottom:8,left:8,zIndex:9999,background:'#1E1E1E',color:'#F4F4F4',padding:'6px 10px',borderRadius:12,fontSize:12}}>
        BUILD: 2026-03-02-A
      </div>
    </>
  );
}
