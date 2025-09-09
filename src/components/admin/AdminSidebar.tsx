import { NavLink, useLocation } from "react-router-dom";
import { Stethoscope, Home, Settings, BarChart3, Database } from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { title: "Overview", url: "/admin", icon: Home },
    { title: "Estações OSCE", url: "/stations", icon: Stethoscope },
    { title: "Nova Estação", url: "/admin/stations", icon: Database },
    { title: "Relatórios", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Configurações", url: "/dashboard/settings", icon: Settings },
  ];

  const navCls = (active: boolean) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <aside className="w-64 border-r border-border/50 bg-background/95 backdrop-blur-sm hidden md:block">
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border/50">
        <div className="p-2 rounded-lg bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold">Admin</div>
          <div className="text-xs text-muted-foreground">Revalida Pro 3.0</div>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {items.map((item) => (
          <NavLink key={item.title} to={item.url} className={navCls(currentPath === item.url)}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}


