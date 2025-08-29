import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCards, QuickAccessCards } from "@/components/StatsCards";
import { ActivityTimeline, UpcomingActivities } from "@/components/ActivityTimeline";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-8">
              {/* Stats Overview */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Visão Geral</h2>
                <StatsCards />
              </section>

              {/* Quick Access */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
                <QuickAccessCards />
              </section>

              {/* Activity Section */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ActivityTimeline />
                </div>
                <div>
                  <UpcomingActivities />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;