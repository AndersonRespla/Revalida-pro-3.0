import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Stethoscope, 
  Brain, 
  Users, 
  Zap, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Bell,
  Sparkles
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Estações OSCE", url: "/dashboard/stations", icon: Stethoscope },
  { title: "IA Independente", url: "/dashboard/ai", icon: Brain },
  { title: "Colaborativo", url: "/dashboard/collaborative", icon: Users },
  { title: "Modo Híbrido", url: "/dashboard/hybrid", icon: Zap },
  { title: "Biblioteca", url: "/dashboard/library", icon: BookOpen },
  { title: "Relatórios", url: "/dashboard/reports", icon: BarChart3 },
];

const bottomItems = [
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive 
        ? "bg-primary/10 text-primary shadow-sm" 
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-border/50 bg-background/95 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Revalida Pro</span>
              <span className="text-xs text-muted-foreground">v3.0</span>
            </div>
          </div>
        )}
        <SidebarTrigger className="h-8 w-8" />
      </div>

      <SidebarContent className="px-3 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${collapsed ? "hidden" : ""}`}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                      {isActive(item.url) && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Novidades Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className={`px-3 py-2 text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-2 ${collapsed ? "hidden" : ""}`}>
            <Sparkles className="h-3 w-3" />
            Novidades
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={`mx-3 p-3 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 ${collapsed ? "hidden" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-secondary" />
                <Badge className="bg-secondary/20 text-secondary text-xs">
                  Novo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                50 novos casos OSCE adicionados este mês!
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}