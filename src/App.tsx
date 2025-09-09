import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SimulationLanding from "./pages/SimulationLanding";
import SimulationExam from "./pages/SimulationExam";
import SimulationStudy from "./pages/SimulationStudy";
import HybridLobby from "./pages/HybridLobby";
import HybridMode from "./pages/HybridMode";
import Stations from "./pages/Stations";
import AdminStations from "./pages/AdminStations";
import Admin from "./pages/Admin";
import Collaborative from "./pages/Collaborative";
import CollaborativeLobby from "./pages/CollaborativeLobby";
import CollaborativeSimulation from "./pages/CollaborativeSimulation";
import ChatGPT from "./pages/ChatGPT";
import Library from "./pages/Library";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Schedule from "./pages/Schedule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 2,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/chatgpt" element={<ChatGPT />} />
          <Route path="/dashboard/library" element={<Library />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/schedule" element={<Schedule />} />
          <Route path="/simulation" element={<SimulationLanding />} />
          <Route path="/simulation/exam" element={<SimulationExam />} />
          <Route path="/simulation/study" element={<SimulationStudy />} />
          <Route path="/simulation/hybrid" element={<HybridLobby />} />
          <Route path="/simulation/hybrid/sim/:code" element={<HybridMode />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/stations" element={<AdminStations />} />
          <Route path="/admin/stations/:id" element={<AdminStations />} />
          <Route path="/dashboard/collaborative" element={<CollaborativeLobby />} />
          <Route path="/collab/room/:code" element={<Collaborative />} />
          <Route path="/collab/simulation/:code" element={<CollaborativeSimulation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </Router>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
