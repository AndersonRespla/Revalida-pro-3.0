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
import { BackButton } from "@/components/BackButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [productUpdates, setProductUpdates] = useState(false);
  const [studyReminders, setStudyReminders] = useState(false);
  const [reportsNotifications, setReportsNotifications] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    // Inicializar com dados do usuário
    if (user) {
      setEmail(user.email || "");
      setFullName(user.full_name || "");
    }
    // Carregar preferências locais
    try {
      setProductUpdates(localStorage.getItem("pref_product_updates") === "1");
      setStudyReminders(localStorage.getItem("pref_study_reminders") === "1");
      setReportsNotifications(localStorage.getItem("pref_reports_notifications") === "1");
      const compact = localStorage.getItem("ui_compact_mode") === "1";
      setCompactMode(compact);
      document.documentElement.classList.toggle("compact", compact);
    } catch {}
  }, [user]);

  useEffect(() => {
    // Sincronizar switch de tema com next-themes
    setDarkMode(theme === "dark");
  }, [theme]);

  const handleSaveAccount = async () => {
    if (!user) {
      toast({ title: "Você precisa estar logado", description: "Faça login para alterar sua conta" });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "Senhas não coincidem", description: "Verifique a confirmação", variant: "destructive" as any });
      return;
    }
    try {
      setSavingAccount(true);
      // Atualizar nome (metadata)
      const updates: any = { data: { full_name: fullName } };
      // Atualizar email se alterado
      if (email && email !== user.email) {
        updates.email = email;
      }
      const { error: updateError } = await supabase.auth.updateUser(updates);
      if (updateError) throw updateError;

      // Atualizar senha se informada
      if (newPassword) {
        const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
        if (passError) throw passError;
      }

      toast({ title: "Configurações salvas", description: "Dados da conta atualizados" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Falha ao salvar", description: err?.message || "Tente novamente", variant: "destructive" as any });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      localStorage.setItem("pref_product_updates", productUpdates ? "1" : "0");
      localStorage.setItem("pref_study_reminders", studyReminders ? "1" : "0");
      localStorage.setItem("pref_reports_notifications", reportsNotifications ? "1" : "0");
      toast({ title: "Preferências salvas", description: "Notificações atualizadas" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message || "Tente novamente", variant: "destructive" as any });
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleToggleTheme = (checked: boolean) => {
    setDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const handleToggleCompact = (checked: boolean) => {
    setCompactMode(checked);
    try {
      localStorage.setItem("ui_compact_mode", checked ? "1" : "0");
    } catch {}
    document.documentElement.classList.toggle("compact", checked);
  };

  const disabled = !user;

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
                  <h1 className="text-3xl font-bold">Configurações</h1>
                  <p className="text-muted-foreground">Gerencie suas preferências de conta, notificação e aparência</p>
                  {disabled && (
                    <p className="text-xs text-yellow-500 mt-1">Você não está logado. Entre para editar suas informações.</p>
                  )}
                </div>
              </div>

              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full sm:w-auto grid-cols-3">
                  <TabsTrigger value="account">Conta</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                  <TabsTrigger value="appearance">Aparência</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome Completo</Label>
                          <Input placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={disabled} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} />
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nova Senha</Label>
                          <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={disabled} />
                        </div>
                        <div>
                          <Label>Confirmar Nova Senha</Label>
                          <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={disabled} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="destructive" 
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja sair da sua conta?')) {
                              await signOut();
                              window.location.href = '/';
                            }
                          }}
                          disabled={disabled}
                        >
                          Sair da Conta
                        </Button>
                        <Button className="min-w-40" onClick={handleSaveAccount} disabled={disabled || savingAccount}>{savingAccount ? "Salvando..." : "Salvar Alterações"}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferências de Notificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Atualizações de produto</p>
                          <p className="text-sm text-muted-foreground">Receba novidades e melhorias</p>
                        </div>
                        <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Lembretes de estudo</p>
                          <p className="text-sm text-muted-foreground">Alertas para manter sua rotina</p>
                        </div>
                        <Switch checked={studyReminders} onCheckedChange={setStudyReminders} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Resultados e relatórios</p>
                          <p className="text-sm text-muted-foreground">Notifique quando novos relatórios estiverem prontos</p>
                        </div>
                        <Switch checked={reportsNotifications} onCheckedChange={setReportsNotifications} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" className="min-w-40" onClick={handleSaveNotifications} disabled={savingNotifications}>{savingNotifications ? "Salvando..." : "Salvar Preferências"}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appearance" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aparência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Tema escuro</p>
                          <p className="text-sm text-muted-foreground">Ativar/desativar tema escuro</p>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={handleToggleTheme} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Modo compacto</p>
                          <p className="text-sm text-muted-foreground">Reduzir espaçamentos para ver mais conteúdo</p>
                        </div>
                        <Switch checked={compactMode} onCheckedChange={handleToggleCompact} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
