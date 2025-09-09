import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface CriterionOption {
  id: string;
  label: string; // Adequado, Parcialmente adequado, Inadequado
  points: number; // 0, 0.5, 1.0, etc.
  description: string; // Guia do que caracteriza cada nível
}

interface Criterion {
  id: string;
  title: string; // Título do critério (ex: Apresentação)
  instruction: string; // Instrução com os itens a verificar
  options: CriterionOption[]; // Opções de pontuação
}

type ExamType = "text" | "image";

interface ExamItem {
  id: string;
  title: string; // Ex: Impresso 1 - Exame físico
  type: ExamType; // text | image
  contentText?: string; // quando type = text
  imageDataUrl?: string; // preview/data quando type = image
  imageUrl?: string; // URL real do Supabase Storage
  orderIndex: number;
}

interface Station {
  id?: string;
  name: string;
  specialty: string;
  code: string;
  participant_info: string;
  actor_info: string;
  exams: ExamItem[];
  criteria: Criterion[];
}

export default function AdminStations() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [station, setStation] = useState<Station>({
    name: "",
    specialty: "",
    code: "",
    participant_info: "",
    actor_info: "",
    exams: [],
    criteria: []
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stations" as any)
        .select("id,name,description,checklist,created_at")
        .eq("id", id)
        .single();

      if (error) throw error;

      const loaded: Station = {
        id: (data as any).id,
        name: (data as any).name,
        specialty: ((data as any).checklist?.specialty as string) || "",
        code: "-",
        participant_info: ((data as any).checklist?.participant_info as string) || (data as any).description || "",
        actor_info: ((data as any).checklist?.actor_info as string) || "",
        exams: Array.isArray((data as any).checklist?.exams) ? (data as any).checklist.exams : [],
        criteria: Array.isArray((data as any).checklist?.criteria) ? (data as any).checklist.criteria : []
      };

      setStation(loaded);
    } catch (error) {
      console.error("Erro ao buscar estação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Station, value: string) => {
    setStation(prev => ({ ...prev, [field]: value }));
  };

  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      title: "",
      instruction: "",
      options: [
        { id: `${Date.now().toString()}-o1`, label: "Adequado", points: 1.0, description: "" },
      ]
    };
    setStation(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string) => {
    setStation(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }));
  };

  const addCriterionOption = (criterionIndex: number) => {
    setStation(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => 
        i === criterionIndex 
          ? { ...c, options: [...c.options, { id: `${Date.now()}`, label: "", points: 0, description: "" }] }
          : c
      )
    }));
  };

  const updateCriterionOption = (criterionIndex: number, optionIndex: number, field: keyof CriterionOption, value: string | number) => {
    setStation(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => {
        if (i !== criterionIndex) return c;
        return {
          ...c,
          options: c.options.map((o, oi) => oi === optionIndex ? { ...o, [field]: value } : o)
        };
      })
    }));
  };

  const removeCriterionOption = (criterionIndex: number, optionIndex: number) => {
    setStation(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => {
        if (i !== criterionIndex) return c;
        return { ...c, options: c.options.filter((_, oi) => oi !== optionIndex) };
      })
    }));
  };

  const removeCriterion = (index: number) => {
    setStation(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const addExam = () => {
    const newExam: ExamItem = {
      id: Date.now().toString(),
      title: "",
      type: "text",
      contentText: "",
      orderIndex: (station.exams?.length || 0) + 1,
    };
    setStation(prev => ({ ...prev, exams: [...(prev.exams || []), newExam] }));
  };

  const updateExam = (index: number, field: keyof ExamItem, value: string) => {
    setStation(prev => ({
      ...prev,
      exams: prev.exams.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  const handleExamImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Mostrar preview imediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStation(prev => ({
        ...prev,
        exams: prev.exams.map((ex, i) => i === index ? { ...ex, imageDataUrl: dataUrl } : ex)
      }));
    };
    reader.readAsDataURL(file);

      // Upload para Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('exam-images')
        .upload(fileName, file);

      if (error) {
        console.error('Erro no upload:', error);
        alert('Falha no upload da imagem para o servidor');
        return;
      }

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('exam-images')
        .getPublicUrl(data.path);

      // Atualizar o exame com a URL real do Supabase
      setStation(prev => ({
        ...prev,
        exams: prev.exams.map((ex, i) => i === index ? { 
          ...ex, 
          imageUrl: publicUrl // URL real para salvar no banco
        } : ex)
      }));

      console.log('Imagem enviada com sucesso:', publicUrl);
    } catch (error) {
      console.error('Erro inesperado no upload:', error);
      alert('Erro inesperado no upload da imagem');
    }
  };

  const removeExamImage = (index: number) => {
    setStation(prev => ({
      ...prev,
      exams: prev.exams.map((ex, i) => i === index ? { 
        ...ex, 
        imageDataUrl: undefined,
        imageUrl: undefined 
      } : ex)
    }));
  };

  const removeExam = (index: number) => {
    setStation(prev => ({
      ...prev,
      exams: prev.exams.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!station.name || !station.specialty || !station.code) {
      alert("Preencha os campos obrigatórios");
      return false;
    }
    
    if (station.criteria.length === 0) {
      alert("Adicione pelo menos um critério de avaliação");
      return false;
    }
    const anyInvalidCriterion = station.criteria.some(c => !c.title || !c.instruction || c.options.length === 0 || c.options.some(o => o.label === ""));
    if (anyInvalidCriterion) {
      alert("Preencha título, instrução e pelo menos uma opção válida em cada critério");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Preparar os exames para salvar
      const examsToSave = station.exams.map(exam => {
        const examData: any = {
          id: exam.id,
          title: exam.title,
          type: exam.type,
          orderIndex: exam.orderIndex
        };
        
        if (exam.type === 'text') {
          examData.contentText = exam.contentText;
        } else if (exam.type === 'image') {
          // Garantir que salvamos a URL do Supabase, não o data URL
          examData.imageUrl = exam.imageUrl || '';
        }
        
        return examData;
      });

      console.log('Exames a salvar:', examsToSave);

      const checklistPayload = {
        participant_info: station.participant_info,
        actor_info: station.actor_info,
        specialty: station.specialty,
        exams: examsToSave,
        criteria: station.criteria,
      } as any;

      console.log('Payload completo:', checklistPayload);

      if (isEditing) {
        const { error } = await supabase
          .from("stations" as any)
          .update({ name: station.name, description: station.participant_info, checklist: checklistPayload })
          .eq("id", station.id)
          .select("id")
          .single();
        if (error) throw error;
        alert("Estação atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("stations" as any)
          .insert({ name: station.name, description: station.participant_info, checklist: checklistPayload })
          .select("id")
          .single();
        if (error) throw error;
        alert("Estação criada com sucesso!");
      }
      navigate('/stations');
    } catch (error) {
      console.error("Erro ao salvar estação:", error);
      alert("Erro ao salvar estação");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Carregando estação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Editar Estação' : 'Nova Estação OSCE'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? 'Modifique os dados da estação' : 'Configure uma nova estação para simulações'}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Estação *</Label>
                  <Input
                    id="name"
                    value={station.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Estação Cardiologia"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Input
                    id="specialty"
                    value={station.specialty}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    placeholder="Ex: Cardiologia"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">Código da Estação *</Label>
                  <Input
                    id="code"
                    value={station.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Ex: CARD-001"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações de Simulação */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="participant_info">Informações ao Participante *</Label>
                  <Textarea
                    id="participant_info"
                    value={station.participant_info}
                    onChange={(e) => handleInputChange('participant_info', e.target.value)}
                    placeholder="Instruções para o aluno sobre o que fazer na estação"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="actor_info">Informações ao Ator *</Label>
                  <Textarea
                    id="actor_info"
                    value={station.actor_info}
                    onChange={(e) => handleInputChange('actor_info', e.target.value)}
                    placeholder="Dados do paciente que o ator deve simular"
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exames Disponíveis (múltiplos) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Exames Disponíveis</CardTitle>
                  <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={addExam}>
                    <Plus className="h-4 w-4" />
                    Adicionar Exame
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {station.exams.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum exame adicionado. Clique em "Adicionar Exame".</p>
                ) : (
                  <div className="space-y-6">
                    {station.exams.map((exam, index) => (
                      <div key={exam.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Exame {index + 1}</h4>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeExam(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Título</Label>
                            <Input value={exam.title} onChange={(e) => updateExam(index, 'title', e.target.value)} placeholder="Ex: Impresso 1 - Exame físico" />
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <select
                              value={exam.type}
                              onChange={(e) => updateExam(index, 'type', e.target.value as ExamType)}
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="text">Texto</option>
                              <option value="image">Imagem</option>
                            </select>
                          </div>
                          <div>
                            <Label>Ordem</Label>
                            <Input type="number" value={exam.orderIndex} onChange={(e) => updateExam(index, 'orderIndex', e.target.value)} />
                          </div>
                        </div>

                        {exam.type === 'text' ? (
                          <div>
                            <Label>Conteúdo (texto)</Label>
                            <Textarea rows={4} value={exam.contentText || ''} onChange={(e) => updateExam(index, 'contentText', e.target.value)} placeholder="Cole aqui o texto do exame (ex: sinais vitais, achados, descrições)" />
                          </div>
                        ) : (
                          <div>
                            <Label>Imagem</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              {exam.imageDataUrl || exam.imageUrl ? (
                                <div className="space-y-4">
                                  <img 
                                    src={exam.imageDataUrl || exam.imageUrl} 
                                    alt="Preview" 
                                    className="max-w-full h-48 object-contain mx-auto rounded" 
                                  />
                                  <div className="text-center">
                                    {exam.imageUrl && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        ✅ Imagem salva no servidor
                                      </p>
                                    )}
                                  <Button type="button" variant="outline" onClick={() => removeExamImage(index)} className="flex items-center gap-2">
                                    <X className="h-4 w-4" /> Remover Imagem
                                  </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <p className="text-muted-foreground mb-2">Clique para fazer upload ou arraste uma imagem</p>
                                  <Input type="file" accept="image/*" onChange={(e) => handleExamImageUpload(index, e)} className="hidden" id={`image-upload-${exam.id}`} />
                                  <Label htmlFor={`image-upload-${exam.id}`} className="cursor-pointer inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent">Selecionar Imagem</Label>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Critérios de Avaliação (rubrica) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Critérios de Avaliação (Rubrica)</CardTitle>
                  <Button
                    type="button"
                    onClick={addCriterion}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Critério
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {station.criteria.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum critério adicionado. Clique em "Adicionar Critério" para começar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {station.criteria.map((criterion, index) => (
                      <div key={criterion.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Critério {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriterion(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Título do Critério</Label>
                              <Input value={criterion.title} onChange={(e) => updateCriterion(index, 'title', e.target.value)} placeholder="Ex: Apresentação" />
                            </div>
                            <div>
                              <Label>Instrução (o que avaliar)</Label>
                              <Input value={criterion.instruction} onChange={(e) => updateCriterion(index, 'instruction', e.target.value)} placeholder="Ex: (1) identifica-se; (2) cumprimenta..." />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Opções de Pontuação</h5>
                            <Button type="button" variant="outline" size="sm" onClick={() => addCriterionOption(index)} className="flex items-center gap-2">
                              <Plus className="h-4 w-4" /> Adicionar Opção
                            </Button>
                          </div>

                          {criterion.options.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Adicione pelo menos uma opção de pontuação.</p>
                          ) : (
                            <div className="space-y-3">
                              {criterion.options.map((opt, oi) => (
                                <div key={opt.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                  <div>
                                    <Label>Rótulo</Label>
                                    <Input value={opt.label} onChange={(e) => updateCriterionOption(index, oi, 'label', e.target.value)} placeholder="Ex: Adequado" />
                                  </div>
                                  <div>
                                    <Label>Pontos</Label>
                                    <Input type="number" step="0.1" value={opt.points} onChange={(e) => updateCriterionOption(index, oi, 'points', Number(e.target.value))} placeholder="1.0" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input value={opt.description} onChange={(e) => updateCriterionOption(index, oi, 'description', e.target.value)} placeholder="Ex: realiza as duas ações" />
                                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeCriterionOption(index, oi)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/stations')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="medical"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar Estação' : 'Criar Estação')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
