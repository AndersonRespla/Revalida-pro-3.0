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

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onOpenAuth={() => setAuthOpen(true)} />
      <div className="pt-20">
        <div className="container mx-auto px-6 mb-4 flex justify-end">
          <button
            onClick={toggleTheme}
            className="text-xs rounded-md border px-3 py-1 bg-muted/40 hover:bg-muted transition-colors"
          >
            Alternar tema
          </button>
        </div>
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
