import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Stethoscope, Calendar, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface Station {
  id: string;
  name: string;
  specialty: string;
  code: string;
  participant_info: string;
  actor_info: string;
  available_exams: string;
  created_at: string;
}

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdmin = useAdmin();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      console.log("Buscando estações...");
      
      const { data, error } = await supabase
        .from("stations" as any)
        .select("id,name,description,checklist,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      console.log("Resultado da consulta:", { data, error });

      if (error) throw error;

      const mapped: Station[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        specialty: row.checklist?.specialty || "",
        code: "-",
        participant_info: row.checklist?.participant_info || row.description || "",
        actor_info: row.checklist?.actor_info || "",
        available_exams: Array.isArray(row.checklist?.exams) ? `${row.checklist.exams.length} exame(s)` : "",
        created_at: row.created_at || new Date().toISOString(),
      }));

      console.log("Estações mapeadas:", mapped);
      setStations(mapped);
    } catch (error) {
      console.error("Erro ao buscar estações:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Estações OSCE</h1>
            <p className="text-muted-foreground mt-2">
              Banco de estações para simulações de habilidades clínicas
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => navigate('/admin/stations')} 
              variant="medical"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Estação
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Estações</p>
                  <p className="text-2xl font-bold">{stations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Especialidades</p>
                  <p className="text-2xl font-bold">{new Set(stations.map(s => s.specialty)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="text-2xl font-bold">
                    {stations.length > 0 ? formatDate(stations[0].created_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo por Estação</p>
                  <p className="text-2xl font-bold">10 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Estações */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Carregando estações...</p>
          </div>
        ) : stations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma estação cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira estação OSCE para simulações
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => navigate('/admin/stations')} 
                  variant="medical"
                >
                  Criar Primeira Estação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <Card 
                key={station.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/stations/${station.id}`)}
                role="button"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{station.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{station.specialty}</Badge>
                        <Badge variant="outline">{station.code}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Informações ao Participante</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {station.participant_info}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Informações ao Ator</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {station.actor_info}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Exames Disponíveis</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {station.available_exams}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Criada em {formatDate(station.created_at)}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/stations/${station.id}`); }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
