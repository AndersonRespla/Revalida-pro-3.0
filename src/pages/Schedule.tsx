import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface ThemeGoal {
  id: string;
  theme: string;
  minutesPerDay: number;
  daysOfWeek: string[]; // ["mon","tue",...]
}

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dailyMinutes, setDailyMinutes] = useState<number>(120);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [themeGoals, setThemeGoals] = useState<ThemeGoal[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Carregar do localStorage
    try {
      const lsDaily = localStorage.getItem("schedule_daily_minutes");
      const lsRem = localStorage.getItem("schedule_reminders");
      const lsThemes = localStorage.getItem("schedule_theme_goals");
      if (lsDaily) setDailyMinutes(Number(lsDaily));
      if (lsRem) setRemindersEnabled(lsRem === "1");
      if (lsThemes) setThemeGoals(JSON.parse(lsThemes));
    } catch {}
  }, []);

  const addThemeGoal = () => {
    setThemeGoals((prev) => [
      ...prev,
      { id: String(Date.now()), theme: "", minutesPerDay: 30, daysOfWeek: [] },
    ]);
  };

  const updateThemeGoal = (id: string, field: keyof ThemeGoal, value: any) => {
    setThemeGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const toggleDay = (id: string, day: string) => {
    setThemeGoals((prev) => prev.map((g) => {
      if (g.id !== id) return g;
      const has = g.daysOfWeek.includes(day);
      return { ...g, daysOfWeek: has ? g.daysOfWeek.filter(d => d !== day) : [...g.daysOfWeek, day] };
    }));
  };

  const removeThemeGoal = (id: string) => {
    setThemeGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Persist localmente
      localStorage.setItem("schedule_daily_minutes", String(dailyMinutes));
      localStorage.setItem("schedule_reminders", remindersEnabled ? "1" : "0");
      localStorage.setItem("schedule_theme_goals", JSON.stringify(themeGoals));

      // Persistir em metadata (se logado)
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: {
            schedule_daily_minutes: dailyMinutes,
            schedule_reminders: remindersEnabled ? 1 : 0,
            schedule_theme_goals: themeGoals,
          },
        });
        if (error) throw error;
      }

      toast({ title: "Metas salvas", description: "Seu agendamento foi atualizado" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message || "Tente novamente", variant: "destructive" as any });
    } finally {
      setSaving(false);
    }
  };

  const days: { id: string; label: string }[] = [
    { id: "mon", label: "Seg" },
    { id: "tue", label: "Ter" },
    { id: "wed", label: "Qua" },
    { id: "thu", label: "Qui" },
    { id: "fri", label: "Sex" },
    { id: "sat", label: "Sáb" },
    { id: "sun", label: "Dom" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-8">
              <div className="flex items-start gap-4">
                <BackButton />
                <div>
                  <h1 className="text-3xl font-bold">Agendar</h1>
                  <p className="text-muted-foreground">Defina metas de estudo por dia e por tema</p>
                </div>
              </div>

              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger value="daily">Meta diária</TabsTrigger>
                  <TabsTrigger value="themes">Por tema</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meta diária de estudo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <Label>Minutos por dia</Label>
                          <Input type="number" min={0} value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value || 0))} />
                        </div>
                        <div className="flex items-center justify-between md:justify-start gap-3">
                          <div>
                            <Label>Lembretes</Label>
                            <p className="text-xs text-muted-foreground">Motivação diária</p>
                          </div>
                          <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="themes" className="mt-6">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle>Metas por tema</CardTitle>
                      <Button variant="outline" size="sm" onClick={addThemeGoal} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {themeGoals.length === 0 ? (
                        <p className="text-muted-foreground">Nenhuma meta de tema. Clique em Adicionar.</p>
                      ) : (
                        <div className="space-y-4">
                          {themeGoals.map((g) => (
                            <div key={g.id} className="border rounded-lg p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                  <Label>Tema</Label>
                                  <Input value={g.theme} onChange={(e) => updateThemeGoal(g.id, "theme", e.target.value)} placeholder="Ex: Cardiologia, Pediatria, Ética" />
                                </div>
                                <div>
                                  <Label>Minutos por dia</Label>
                                  <Input type="number" min={0} value={g.minutesPerDay} onChange={(e) => updateThemeGoal(g.id, "minutesPerDay", Number(e.target.value || 0))} />
                                </div>
                                <div className="flex md:justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => removeThemeGoal(g.id)} className="text-destructive gap-2"><Trash2 className="h-4 w-4" />Remover</Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {days.map((d) => {
                                  const active = g.daysOfWeek.includes(d.id);
                                  return (
                                    <Badge key={d.id} variant={active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleDay(g.id, d.id)}>
                                      {d.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button className="min-w-40" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Metas"}</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
