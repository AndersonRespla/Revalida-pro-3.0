import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Search, User, Plus, Calendar } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function DashboardHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Usuário';
  
  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Title and Breadcrumb */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta, {displayName}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar casos OSCE..." 
              className="w-64 pl-9 bg-muted/50 border-border/50"
            />
          </div>

          {/* Quick Actions */}
          <Button variant="medical-outline" size="sm" className="gap-2" onClick={() => (window.location.href = '/simulation')}>
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>

          <Button variant="ghost" size="sm" className="gap-2" onClick={() => (window.location.href = '/dashboard/schedule')}>
            <Calendar className="h-4 w-4" />
            Agendar
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Nenhuma nova notificação</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/schedule')}>Ir para Agendar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/reports')}>Ver Relatórios</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => (window.location.href = '/dashboard/settings')}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden md:inline">{displayName}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}