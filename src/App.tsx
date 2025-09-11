import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SimulationLanding = lazy(() => import("./pages/SimulationLanding"));
const SimulationExam = lazy(() => import("./pages/SimulationExam"));
const SimulationStudy = lazy(() => import("./pages/SimulationStudy"));
const SimulationTest = lazy(() => import("./pages/SimulationTest"));
const HybridLobby = lazy(() => import("./pages/HybridLobby"));
const HybridMode = lazy(() => import("./pages/HybridMode"));
const Stations = lazy(() => import("./pages/Stations"));
const AdminStations = lazy(() => import("./pages/AdminStations"));
const Admin = lazy(() => import("./pages/Admin"));
const Collaborative = lazy(() => import("./pages/Collaborative"));
const CollaborativeLobby = lazy(() => import("./pages/CollaborativeLobby"));
const CollaborativeSimulation = lazy(() => import("./pages/CollaborativeSimulation"));
const ChatGPT = lazy(() => import("./pages/ChatGPT"));
const Library = lazy(() => import("./pages/Library"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Schedule = lazy(() => import("./pages/Schedule"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/Auth"));

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
  const [/*showAuthModal*/, /*setShowAuthModal*/] = useState(false);

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
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>}>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

          {/* Privadas */}
          <Route element={user ? <Outlet /> : <Navigate to="/auth" replace /> }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/chatgpt" element={<ChatGPT />} />
            <Route path="/dashboard/library" element={<Library />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/schedule" element={<Schedule />} />
            <Route path="/simulation" element={<SimulationLanding />} />
            <Route path="/simulation/exam" element={<SimulationExam />} />
            <Route path="/simulation/study" element={<SimulationStudy />} />
            <Route path="/simulation/test" element={<SimulationTest />} />
            <Route path="/simulation/hybrid" element={<HybridLobby />} />
            <Route path="/simulation/hybrid/sim/:code" element={<HybridMode />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/stations" element={<AdminStations />} />
            <Route path="/admin/stations/:id" element={<AdminStations />} />
            <Route path="/dashboard/collaborative" element={<CollaborativeLobby />} />
            <Route path="/collab/room/:code" element={<Collaborative />} />
            <Route path="/collab/simulation/:code" element={<CollaborativeSimulation />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <Toaster />
        <Sonner />
      </Router>
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
