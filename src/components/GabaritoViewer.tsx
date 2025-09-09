import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Target, FileText, User, Stethoscope } from "lucide-react";

interface Criterion {
  criterion: string;
  max_score: number;
  description: string;
}

interface ExamItem {
  id: string;
  type: "text" | "image";
  title: string;
  contentText?: string;
  imageUrl?: string;
  orderIndex: number;
}

interface GabaritoData {
  exams: ExamItem[];
  criteria: Criterion[];
  specialty: string;
  actor_info: string;
  participant_info: string;
}

interface GabaritoViewerProps {
  data: GabaritoData;
  stationName?: string;
  showExams?: boolean;
  className?: string;
}

export function GabaritoViewer({ 
  data, 
  stationName, 
  showExams = true, 
  className = "" 
}: GabaritoViewerProps) {
  const totalMaxScore = data.criteria.reduce((sum, criterion) => sum + criterion.max_score, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header da Estação */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">
                {stationName || "Gabarito da Estação"}
              </CardTitle>
              <p className="text-blue-700 font-medium">{data.specialty}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informações da Simulação */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              Informações ao Participante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.participant_info}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              Informações ao Ator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.actor_info}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exames Disponíveis */}
      {showExams && data.exams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Exames Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.exams
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((exam, index) => (
                  <div key={exam.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{exam.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {exam.type === "text" ? "Texto" : "Imagem"}
                      </Badge>
                    </div>
                    
                    {exam.type === "text" ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {exam.contentText}
                      </p>
                    ) : exam.imageUrl ? (
                      <div className="mt-2">
                        <img 
                          src={exam.imageUrl} 
                          alt={exam.title}
                          className="max-h-48 object-contain rounded border"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Imagem não disponível
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critérios de Avaliação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Critérios de Avaliação
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {data.criteria.length} critérios</span>
            <span>Pontuação máxima: {totalMaxScore} pontos</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.criteria.map((criterion, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-2">
                      {index + 1}. {criterion.criterion}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className="text-sm font-medium px-3 py-1"
                    >
                      {criterion.max_score} ponto{criterion.max_score !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                {index < data.criteria.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Pontuação */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Resumo da Pontuação
            </h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {totalMaxScore} pontos
            </div>
            <p className="text-sm text-green-700">
              Pontuação máxima possível nesta estação
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GabaritoViewer;
