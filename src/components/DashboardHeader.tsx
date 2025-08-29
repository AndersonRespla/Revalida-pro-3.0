import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, User, Plus, Calendar } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Title and Breadcrumb */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo de volta, Dr. Silva
            </p>
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
          <Button variant="medical-outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>

          <Button variant="ghost" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Agendar
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground p-0 text-xs">
              3
            </Badge>
          </Button>

          {/* Profile */}
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden md:inline">Dr. Silva</span>
          </Button>
        </div>
      </div>
    </header>
  );
}