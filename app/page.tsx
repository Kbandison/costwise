import { HeroSection } from "@/components/sections/hero";
import { StatsSection } from "@/components/sections/stats";
import { MapSection } from "@/components/sections/map-section";
import { SearchSection } from "@/components/sections/search-section";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { CTASection } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <MapSection />
      <SearchSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
