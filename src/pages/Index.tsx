import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Bot,
  Mic,
  Clock,
  Sparkles,
  Users,
  Brain,
  Stethoscope,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimaryCta = () => {
    if (user) navigate("/dashboard");
    else setAuthOpen(true);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Revalida Pro",
      url:
        typeof window !== "undefined" ? window.location.origin : "https://dreasyai.com",
      potentialAction: {
        "@type": "SearchAction",
        target: `${typeof window !== "undefined" ? window.location.origin : "https://dreasyai.com"}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation onOpenAuth={() => setAuthOpen(true)} />
      <main className="pt-20">
        {/* Theme toggle */}
        <div className="container mx-auto px-6 mb-4 flex justify-end">
          <button
            onClick={toggleTheme}
            className="text-xs rounded-md border px-3 py-1 bg-muted/40 hover:bg-muted transition-colors"
          >
            Alternar tema
          </button>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-6 py-14">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <Badge className="bg-secondary text-secondary-foreground">
                  Beta fechado • Solicite acesso
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Treine OSCE com IA Conversacional
                  <span className="block text-primary">aprovada pela ElevenLabs</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  O Revalida Pro é a plataforma de simulação OSCE que combina agentes conversacionais
                  de alto nível, checklists criados por médicos revalidados e correção alinhada ao
                  gabarito PEP. Estude de forma direta, prática e no seu tempo.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" variant="medical" className="px-6" onClick={handlePrimaryCta}>
                    Solicitar acesso beta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="medical-outline"
                    className="px-6"
                    onClick={() => {
                      const el = document.getElementById("como-funciona");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Ver como funciona
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Aprovado pela ElevenLabs
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mic className="h-4 w-4 text-primary" />
                    Transcrição Whisper em tempo real
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Alinhado ao PEP/OSCE
                  </div>
                </div>
              </div>
              <div className="space-y-4 animate-medical-float">
                <Card className="card-medical p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/15">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Agente Conversacional Médico</h3>
                      <p className="text-sm text-muted-foreground">
                        Treino de consulta com perguntas e devolutivas realistas.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="card-medical p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <CheckCircle2 className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Correção baseada em PEP</h3>
                      <p className="text-sm text-muted-foreground">
                        Destaques do que acertou e do que faltou, com sugestões de frase.
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="card-medical p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/20">
                      <Clock className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Estude no seu tempo</h3>
                      <p className="text-sm text-muted-foreground">
                        Vídeos e teoria direta ao ponto para rotina corrida.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* PROVA SOCIAL RÁPIDA */}
        <section className="py-6">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">200+</div>
                <div className="text-sm text-muted-foreground">Casos clínicos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Modos de treino</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
              <div>
                <div className="text-2xl font-bold">10 min</div>
                <div className="text-sm text-muted-foreground">por estação</div>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUE TREINO CONVERSACIONAL */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mb-8">
              <h2 className="text-3xl font-bold">Por que treino conversacional?</h2>
              <p className="text-muted-foreground mt-2">
                Falar treina o raciocínio clínico e a comunicação humanizada. Nossos agentes simulam o paciente
                e a banca, forçando organização de hipóteses, condutas e fechamento — exatamente como no dia da prova.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Fixação ativa",
                  desc:
                    "Você formula hipóteses em voz alta e recebe devolutiva na hora.",
                },
                {
                  icon: Users,
                  title: "Human skills",
                  desc: "Empatia, linguagem adequada e estrutura da consulta são avaliadas.",
                },
                {
                  icon: Sparkles,
                  title: "Feedback acionável",
                  desc:
                    "Texto com trechos em verde/vermelho e ‘como falar melhor’.",
                },
              ].map((f, i) => (
                <Card key={i} className="card-medical p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/15">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* MODOS DE TREINO */}
        <section className="py-12" id="modos">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">Modos de Treino</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Bot,
                  title: "IA Independente",
                  desc: "Treine sozinho com agente moderador 24/7.",
                  href: "/simulation/study",
                },
                {
                  icon: Users,
                  title: "Colaborativo",
                  desc: "Treine com colegas alternando papéis de médico e ator.",
                  href: "/dashboard/collaborative",
                },
                {
                  icon: Stethoscope,
                  title: "Híbrido",
                  desc: "IA + colegas, com correção automática e rubrica.",
                  href: "/simulation/hybrid",
                },
              ].map((m, i) => (
                <Card key={i} className="card-medical p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-secondary/40">
                      <m.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">{m.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{m.desc}</p>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => (window.location.href = m.href)}>
                      Começar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PEP / FEEDBACK */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold">Correção alinhada ao PEP</h2>
                <p className="text-muted-foreground mt-2">
                  Nosso feedback compara suas falas com o gabarito PEP e destaca trechos:
                  <span className="text-green-500 font-semibold"> acertos</span> e
                  <span className="text-red-500 font-semibold"> oportunidades</span> — com sugestões de como encaixar
                  as expressões na próxima resposta.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Rubrica por critério (história, exame, hipóteses,
                    condutas).
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Registro automático da transcrição (Whisper).
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Exportação do feedback para revisão.
                  </li>
                </ul>
              </div>
              <Card className="card-medical p-6">
                <style>{`.ok{color:#16a34a;font-weight:600}.miss{color:#dc2626;font-weight:600}`}</style>
                <div className="prose prose-invert max-w-none text-sm">
                  <p>
                    <span className="ok">Apresente-se</span>, confirme <span className="ok">nome e idade</span> e explique o objetivo da consulta.
                    Você não mencionou <span className="miss">verificação de alergias</span> nem <span className="miss">medicações em uso</span>.
                    Sugestão: “Você usa algum medicamento contínuo? Tem alergia a algum fármaco?”
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PROPRIETÁRIO */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Checklists por médicos revalidados",
                  desc:
                    "Material criado por quem já passou pelo processo, focado no essencial.",
                },
                {
                  icon: Clock,
                  title: "Teoria e vídeos diretos",
                  desc: "Aulas curtas e objetivas para rotina corrida. Sem enrolação.",
                },
                {
                  icon: ShieldCheck,
                  title: "Segurança e privacidade",
                  desc: "Supabase e melhores práticas para seus dados e gravações.",
                },
              ].map((c, i) => (
                <Card key={i} className="card-medical p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/15">
                      <c.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-12" id="como-funciona">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">Como funciona</h2>
            <div className="grid md:grid-cols-5 gap-4 text-sm">
              {[
                "Escolha o modo (IA, Colaborativo, Híbrido)",
                "Converse como na prova",
                "Transcrição automática (Whisper)",
                "Feedback PEP com destaques",
                "Plano de revisão focado",
              ].map((s, i) => (
                <Card key={i} className="card-medical p-4">
                  <div className="font-medium">{i + 1}. {s}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-3">Estamos em Beta Fechado</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Estamos validando com grupos de estudantes e médicos. Solicite acesso e entraremos em
              contato com prioridade quando sua vaga for liberada.
            </p>
            <Button size="lg" variant="medical" onClick={handlePrimaryCta}>
              Solicitar acesso beta
            </Button>
      </div>
        </section>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} onSuccess={() => navigate("/dashboard")} />
    </div>
  );
};

export default Index;
