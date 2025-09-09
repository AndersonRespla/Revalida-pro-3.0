import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Share2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface StationRow {
  id: string;
  specialty: string;
  code: string;
}

export default function HybridLobby() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationRow[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationRow[]>([]);
  const [creatorStations, setCreatorStations] = useState<string[]>([]);
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
        setStations([]);
        setFilteredStations([]);
        return;
      }

      console.log("Estações encontradas (dados brutos):", data);
      
      if (data && data.length > 0) {
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

  function toggleCreatorStation(id: string) {
    setCreatorStations((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // limite 5
      return [...prev, id];
    });
  }


  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function createSimulation() {
    if (creatorStations.length === 0) return;
    setCreating(true);
    const code = generateCode();

    try {
      console.log("Criando simulação híbrida com código:", code);
      console.log("Estações do criador:", creatorStations);
      
      // Gerar UUIDs necessários
      const tempCreatorId = crypto.randomUUID();
      const simulationId = crypto.randomUUID();
      
      // Criar simulação com UUID no id e código persistido na coluna `code`
      const { data: sim, error } = await supabase
        .from("simulations" as any)
        .insert({ 
          id: simulationId, // UUID para o ID
          candidate_id: tempCreatorId, // UUID temporário para o criador
          station_id: creatorStations[0], // Primeira estação do criador
          status: "pending",
          code: code // Armazena o código de 6 dígitos na coluna `code`
        })
        .select("id")
        .single();

      if (error || !sim) {
        console.error("Erro ao criar simulação:", error);
        setCreating(false);
        return;
      }

      console.log("Simulação criada com sucesso:", sim);
      
      // Armazenar as estações do criador no localStorage temporariamente
      localStorage.setItem(`hybrid-creator-${code}`, JSON.stringify(creatorStations));
      localStorage.setItem(`hybrid-entrant-${code}`, JSON.stringify([]));
      localStorage.setItem(`hybrid-current-index-${code}`, "0");
      
      setCreatedCode(code);
    } catch (error) {
      console.error("Erro ao criar simulação:", error);
    } finally {
      setCreating(false);
    }
  }

  const inviteLink = useMemo(() => {
    if (!createdCode) return "";
    return `${window.location.origin}/simulation/hybrid/sim/${createdCode}?role=entrant`;
  }, [createdCode]);

  function copyInvite() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
  }

  async function joinAsEntrant() {
    if (joinCode.length < 6) return;
    
    try {
      // Buscar simulação pelo código
      const { data: sim, error } = await supabase
        .from("simulations" as any)
        .select("id")
        .eq("code", joinCode)
        .single();

      if (error || !sim) {
        console.error("Erro ao encontrar simulação:", error);
        return;
      }
      
      navigate(`/simulation/hybrid/sim/${joinCode}?role=entrant`);
    } catch (error) {
      console.error("Erro ao entrar na simulação:", error);
    }
  }

  const creatorSelectedStations = stations.filter(s => creatorStations.includes(s.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Simulações Híbridas</h1>
              <p className="text-muted-foreground mt-2">Crie uma simulação (Criador) ou entre com um código (Entrante).</p>
            </div>
          </div>
          
          {/* Botão de debug */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log("Estado atual:", { stations, filteredStations, loading });
                fetchStations();
              }}
              className="text-xs"
            >
              🔍 Debug: Recarregar Estações
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">
              Estações carregadas: {stations.length} | Filtradas: {filteredStations.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Criar simulação (Criador) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> 
                Criar Simulação (Criador)
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
                      const isSelected = creatorStations.includes(station.id);
                      return (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => toggleCreatorStation(station.id)}
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
              {creatorSelectedStations.length > 0 && (
                <div className="border rounded-md p-3 bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Estações Selecionadas:</h4>
                  <div className="space-y-1">
                    {creatorSelectedStations.map((station) => (
                      <div key={station.id} className="flex items-center justify-between text-sm">
                        <span>{station.specialty} ({station.code})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCreatorStation(station.id)}
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
                  Selecionadas: {creatorStations.length} / 5
                </span>
                <Button 
                  onClick={createSimulation} 
                  disabled={creating || creatorStations.length === 0} 
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
                      onClick={() => navigate(`/simulation/hybrid/sim/${createdCode}?role=creator`)}
                    >
                      Entrar como Criador
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Envie o código ao médico. Ele deve entrar na simulação usando o código acima.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Entrar na simulação (Entrante) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-secondary" /> 
                Entrar na Simulação (Entrante)
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
                onClick={joinAsEntrant} 
                disabled={joinCode.length < 6}
                className="w-full"
              >
                Entrar como Entrante
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Digite o código de 6 dígitos fornecido pelo criador para entrar na simulação.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
