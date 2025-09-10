import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Share2, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface StationRow {
  id: string;
  specialty: string;
  code: string;
}

export default function CollaborativeLobby() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationRow[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    // Filtrar estações baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredStations(stations);
    } else {
      const filtered = stations.filter(station =>
        station.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStations(filtered);
    }
  }, [searchTerm, stations]);

  async function fetchStations() {
    try {
      setLoading(true);
      console.log("Buscando estações...");
      
      // Buscar todas as estações com select simples
      const { data, error } = await supabase
        .from("stations" as any)
        .select("*")
        .limit(20);

      if (error) {
        console.error("Erro ao buscar estações:", error);
        console.error("Detalhes do erro:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        setStations([]);
        setFilteredStations([]);
        return;
      }

      console.log("Estações encontradas (dados brutos):", data);
      
      if (data && data.length > 0) {
        // Mostrar a estrutura da primeira linha
        const firstRow = data[0] as any;
        console.log("Colunas disponíveis:", Object.keys(firstRow));
        console.log("Primeira linha:", firstRow);
        
        // Mapear os dados para o formato esperado
        const stationsData = (data as any[]).map((station: any) => ({
          id: station.id,
          specialty: station.specialty || station.name || station.title || 'Especialidade não definida',
          code: station.code || station.id?.slice(0, 8) || 'Código não definido'
        }));
        
        console.log("Estações mapeadas:", stationsData);
        
        setStations(stationsData);
        setFilteredStations(stationsData);
      } else {
        console.log("Nenhuma estação encontrada");
        setStations([]);
        setFilteredStations([]);
      }
    } catch (error) {
      console.error("Erro ao buscar estações:", error);
      setStations([]);
      setFilteredStations([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // limite 5
      return [...prev, id];
    });
  }

  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function createSimulation() {
    if (selected.length === 0) return;
    setCreating(true);
    const code = generateCode();

    try {
      console.log("Criando simulação com código:", code);
      console.log("Estações selecionadas:", selected);
      
      // Inserir simulação usando 'any' para contornar tipagem
      const { data: sim, error } = await supabase
        .from("simulations" as any)
        .insert({ 
          code, 
          status: "pending", 
          total_stations: selected.length, 
          current_index: 0,
          candidate_id: null, // Campo opcional agora
          station_id: null    // Campo opcional agora
        })
        .select("id, code")
        .single();

      if (error || !sim) {
        console.error("Erro ao criar simulação:", error);
        console.error("Detalhes do erro:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        
        // Se der erro de RLS, mostrar mensagem específica
        if (error?.code === '42P17') {
          console.error("PROBLEMA DE RLS DETECTADO! Execute o SQL para desabilitar RLS na tabela simulations.");
        }
        
        setCreating(false);
        return;
      }

      console.log("Simulação criada com sucesso:", sim);

      // Vincular estações à simulação usando 'any'
      const rows = selected.map((station_id, idx) => ({ 
        simulation_id: (sim as any).id, 
        station_id, 
        order_index: idx + 1 
      }));
      
      console.log("Vincular estações:", rows);
      
      const { error: linkError } = await supabase
        .from("simulation_stations" as any)
        .insert(rows);

      if (linkError) {
        console.error("Erro ao vincular estações:", linkError);
        console.error("Detalhes do erro de vinculação:", {
          message: linkError.message,
          details: linkError.details,
          hint: linkError.hint,
          code: linkError.code
        });
        setCreating(false);
        return;
      }

      console.log("Estações vinculadas com sucesso!");
      setCreatedCode((sim as any).code);
      
      // Redirecionar para a página de simulação
      navigate(`/collab/simulation/${(sim as any).code}?role=actor`);
    } catch (error) {
      console.error("Erro ao criar simulação:", error);
    } finally {
      setCreating(false);
    }
  }

  const inviteLink = useMemo(() => {
    if (!createdCode) return "";
    return `${window.location.origin}/collab/room/${createdCode}?role=actor`;
  }, [createdCode]);

  function copyInvite() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
  }

  function joinAsDoctor() {
    if (joinCode.length < 6) return;
    navigate(`/collab/simulation/${joinCode}?role=doctor`);
  }

  const selectedStations = stations.filter(s => selected.includes(s.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Simulações Colaborativas</h1>
              <p className="text-muted-foreground mt-2">Crie uma simulação (Ator) ou entre com um código (Médico).</p>
            </div>
          </div>
          
          {/* debug removido em produção */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Criar simulação (Ator) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> 
                Criar Simulação (Ator)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escolha até 5 estações (apenas especialidade visível para o médico).
              </p>

              {/* Barra de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por especialidade ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de estações */}
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estações Disponíveis</span>
                    <span className="text-xs text-muted-foreground">
                      {filteredStations.length} de {stations.length}
                    </span>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Carregando estações...</p>
                    </div>
                  ) : stations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-2">⚠️ Erro ao carregar estações</div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Não foi possível carregar as estações do banco de dados.
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Verifique se o Supabase está configurado</p>
                        <p>• Execute o SQL para desabilitar RLS</p>
                        <p>• Verifique se a tabela stations existe</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchStations}
                        className="mt-3"
                      >
                        🔄 Tentar Novamente
                      </Button>
                    </div>
                  ) : filteredStations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "Nenhuma estação encontrada." : "Nenhuma estação disponível."}
                      </p>
                    </div>
                  ) : (
                    filteredStations.map((station) => {
                      const isSelected = selected.includes(station.id);
                      return (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => toggleSelect(station.id)}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{station.specialty}</span>
                            <Badge variant="outline" className="text-xs">
                              {station.code}
                            </Badge>
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Selecionada
                            </Badge>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Estações selecionadas */}
              {selectedStations.length > 0 && (
                <div className="border rounded-md p-3 bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Estações Selecionadas:</h4>
                  <div className="space-y-1">
                    {selectedStations.map((station) => (
                      <div key={station.id} className="flex items-center justify-between text-sm">
                        <span>{station.specialty} ({station.code})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSelect(station.id)}
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Selecionadas: {selected.length} / 5
                </span>
                <Button 
                  onClick={createSimulation} 
                  disabled={creating || selected.length === 0} 
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> 
                  {creating ? "Criando..." : "Criar Simulação"}
                </Button>
              </div>

              {createdCode && (
                <div className="mt-4 border rounded-md p-4 bg-muted/20 space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Código da Simulação:</div>
                    <div className="text-2xl font-mono font-bold text-primary">{createdCode}</div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={copyInvite} className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" /> Copiar Link
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => navigate(`/collab/room/${createdCode}?role=actor`)}
                    >
                      Entrar como Ator
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Envie o código ao médico. Ele deve entrar na simulação usando o código acima.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Entrar na simulação (Médico) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-secondary" /> 
                Entrar na Simulação (Médico)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="join">Código da Simulação</Label>
                <Input 
                  id="join" 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="Ex: 123456" 
                  className="text-center font-mono text-lg"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={joinAsDoctor} 
                disabled={joinCode.length < 6}
                className="w-full"
              >
                Entrar como Médico
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Digite o código de 6 dígitos fornecido pelo ator para entrar na simulação.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


