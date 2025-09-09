import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLibraryMaterials } from "@/hooks/useUserStats";
import { BackButton } from "@/components/BackButton";
import { 
  Search, 
  BookOpen, 
  FileText, 
  Video, 
  Download, 
  Eye,
  Clock,
  Star,
  Filter,
  Users,
  Calendar,
  Tag
} from "lucide-react";

interface LibraryItem {
  id: string;
  title: string;
  type: 'document' | 'video' | 'case' | 'guideline';
  category: string;
  specialty: string;
  description: string;
  author: string;
  date: string;
  duration?: string;
  rating: number;
  downloads: number;
  views: number;
  tags: string[];
  thumbnail?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export default function Library() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Buscar dados reais da API
  const { data: libraryData, isLoading, isError } = useLibraryMaterials(searchTerm, selectedCategory);

  // Fallback para dados de exemplo se não houver dados
  const libraryItems: LibraryItem[] = libraryData?.materials || [
    {
      id: '1',
      title: 'Diretrizes de Cardiologia 2024',
      type: 'document',
      category: 'guidelines',
      specialty: 'Cardiologia',
      description: 'Diretrizes atualizadas da Sociedade Brasileira de Cardiologia para tratamento de hipertensão arterial sistêmica.',
      author: 'SBC - Sociedade Brasileira de Cardiologia',
      date: '2024-01-15',
      rating: 4.8,
      downloads: 1234,
      views: 5678,
      tags: ['hipertensão', 'diretrizes', 'cardiologia', 'sbc'],
      isNew: true
    },
    {
      id: '2',
      title: 'Caso Clínico: Pneumonia Comunitária',
      type: 'case',
      category: 'cases',
      specialty: 'Pneumologia',
      description: 'Caso clínico completo de pneumonia comunitária em adulto jovem, incluindo anamnese, exame físico e condutas.',
      author: 'Dr. Maria Silva',
      date: '2024-01-10',
      duration: '45 min',
      rating: 4.6,
      downloads: 890,
      views: 2340,
      tags: ['pneumonia', 'antibióticos', 'diagnóstico'],
      isPremium: true
    },
    {
      id: '3',
      title: 'Técnicas de Anamnese OSCE',
      type: 'video',
      category: 'training',
      specialty: 'Geral',
      description: 'Vídeo demonstrativo das melhores técnicas de anamnese para provas OSCE, com exemplos práticos.',
      author: 'Prof. João Santos',
      date: '2024-01-08',
      duration: '32 min',
      rating: 4.9,
      downloads: 2156,
      views: 8901,
      tags: ['anamnese', 'osce', 'comunicação'],
      thumbnail: '/placeholder.svg'
    },
    {
      id: '4',
      title: 'Protocolos de Emergência',
      type: 'document',
      category: 'protocols',
      specialty: 'Medicina de Emergência',
      description: 'Compilação dos principais protocolos de atendimento em medicina de emergência.',
      author: 'ABRAMEDE',
      date: '2024-01-05',
      rating: 4.7,
      downloads: 3421,
      views: 12045,
      tags: ['emergência', 'protocolos', 'urgência'],
      isNew: true
    },
    {
      id: '5',
      title: 'Neurologia: Casos Complexos',
      type: 'case',
      category: 'cases',
      specialty: 'Neurologia',
      description: 'Série de casos complexos em neurologia com discussão detalhada de diagnóstico diferencial.',
      author: 'Dr. Carlos Mendes',
      date: '2023-12-28',
      duration: '1h 15min',
      rating: 4.5,
      downloads: 567,
      views: 1890,
      tags: ['neurologia', 'diagnóstico diferencial', 'complexo'],
      isPremium: true
    }
  ];

  // Usar categorias da API ou fallback
  const categories = libraryData?.categories || [
    { id: 'all', name: 'Todos', count: libraryItems.length },
    { id: 'guidelines', name: 'Diretrizes', count: libraryItems.filter(item => item.category === 'guidelines').length },
    { id: 'cases', name: 'Casos Clínicos', count: libraryItems.filter(item => item.category === 'cases').length },
    { id: 'training', name: 'Treinamento', count: libraryItems.filter(item => item.category === 'training').length },
    { id: 'protocols', name: 'Protocolos', count: libraryItems.filter(item => item.category === 'protocols').length }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'case': return BookOpen;
      case 'guideline': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-500/10 text-blue-500';
      case 'video': return 'bg-red-500/10 text-red-500';
      case 'case': return 'bg-green-500/10 text-green-500';
      case 'guideline': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  // Usar dados já filtrados da API (não precisa filtrar no frontend)
  const filteredItems = libraryItems;

  // Usar estatísticas da API ou calcular fallback
  const stats = libraryData?.stats || {
    totalItems: libraryItems.length,
    totalDownloads: 8200,
    totalViews: 31000,
    averageRating: 4.7
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <BackButton />
                  <div>
                    <h1 className="text-3xl font-bold">Biblioteca</h1>
                    <p className="text-muted-foreground">
                      Acesse materiais de estudo, casos clínicos e diretrizes médicas
                    </p>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, descrição ou tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros Avançados
                  </Button>
                </div>
              </div>

              {/* Categories */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="gap-2">
                      {category.name}
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-6">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                            <div className="space-y-1 flex-1">
                              <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                              <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total de Itens</p>
                              <p className="text-xl font-bold">{stats.totalItems}</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Downloads</p>
                              <p className="text-xl font-bold">{(stats.totalDownloads / 1000).toFixed(1)}K</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Visualizações</p>
                              <p className="text-xl font-bold">{(stats.totalViews / 1000).toFixed(0)}K</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Avaliação Média</p>
                              <p className="text-xl font-bold">{stats.averageRating.toFixed(1)}</p>
                            </div>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                      const TypeIcon = getTypeIcon(item.type);
                      
                      return (
                        <Card key={item.id} className="group hover:shadow-lg transition-all duration-200">
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div className="flex gap-1">
                                {item.isNew && (
                                  <Badge variant="secondary" className="text-xs">
                                    Novo
                                  </Badge>
                                )}
                                {item.isPremium && (
                                  <Badge className="text-xs bg-yellow-500/10 text-yellow-600">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{item.author}</span>
                                <span>•</span>
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                {item.duration && (
                                  <>
                                    <span>•</span>
                                    <Clock className="h-3 w-3" />
                                    <span>{item.duration}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {item.specialty}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">{item.rating}</span>
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>

                              {/* Stats */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{item.views.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  <span>{item.downloads.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" className="flex-1">
                                <Eye className="h-3 w-3 mr-1" />
                                Visualizar
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
                      <p className="text-muted-foreground">
                        Tente ajustar seus filtros ou termo de busca
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
