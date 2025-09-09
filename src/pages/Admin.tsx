import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Database, Mic, MessageSquare, ClipboardList, Settings } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { BackButton } from "@/components/BackButton";

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground mt-1">Painel de controle do Revalida Pro 3.0</p>
          </div>
          <Button variant="medical" onClick={() => navigate('/stations')} className="hidden md:inline-flex">
            Ir para Estações
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="h-5 w-5 text-primary" /> Estações OSCE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Gerencie o banco de estações e critérios.</p>
              <div className="flex gap-3">
                <Button size="sm" onClick={() => navigate('/admin/stations')}>Nova estação</Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/stations')}>Ver estações</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="h-5 w-5 text-primary" /> Áudio e Transcrições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Monitore envios ao Whisper e status de transcrições.</p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={() => navigate('/simulation')}>Testar simulação</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-primary" /> Agentes ElevenLabs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Configurações de moderador e pacientes.</p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={() => navigate('/simulation')}>Abrir Conversa</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estações cadastradas</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Simulações concluídas</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Transcrições geradas</p>
                <p className="text-2xl font-bold">9</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Feedbacks enviados</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


