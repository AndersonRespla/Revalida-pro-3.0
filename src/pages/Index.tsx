// Revalida Pro 3.0 - Landing Page

import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { AppScreensSection } from "@/components/AppScreensSection";
import { CTASection } from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <AppScreensSection />
        <CTASection />
      </div>
    </div>
  );
};

export default Index;
