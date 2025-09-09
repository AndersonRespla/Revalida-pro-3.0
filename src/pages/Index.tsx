// Revalida Pro 3.0 - Landing Page

import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { AppScreensSection } from "@/components/AppScreensSection";
import { CTASection } from "@/components/CTASection";
import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimaryCta = () => {
    if (user) navigate('/dashboard');
    else setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onOpenAuth={() => setAuthOpen(true)} />
      <div className="pt-20">
        <HeroSection onPrimaryCta={handlePrimaryCta} />
        <ProblemSection />
        <SolutionSection />
        <AppScreensSection />
        <CTASection />
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} onSuccess={() => navigate('/dashboard')} />
    </div>
  );
};

export default Index;
