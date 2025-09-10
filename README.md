# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/92133003-9dd6-4944-8691-86464d79b8aa

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/92133003-9dd6-4944-8691-86464d79b8aa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 📱 Funcionalidades

- **Simulação OSCE**: 3 estações de 10 minutos cada
- **Estações OSCE**: Página dedicada com listagem, material teórico e metodologia
- **Admin de Estações**: Interface para cadastrar/editar estações com critérios e pesos
- **Gravação de Áudio**: MediaRecorder integrado
- **Transcrição**: OpenAI Whisper em tempo real
- **Feedback Personalizado**: Análise PEP/OSCE com destaques visuais
- **Agentes ElevenLabs**: Moderador e pacientes conversacionais
- **Persistência**: Supabase Storage + PostgreSQL

## 🔧 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Functions (Serverless)
- **Banco**: Supabase (PostgreSQL + Storage)
- **IA**: OpenAI Whisper + GPT-4
- **Agentes**: ElevenLabs Convai

## 📁 Estrutura

```
├── api/                    # Funções serverless Vercel
│   ├── transcribe.ts      # Transcrição Whisper
│   ├── feedback.ts        # Geração de feedback
│   └── _supabase.ts       # Cliente admin Supabase
├── src/
│   ├── pages/
│   │   ├── Simulation.tsx # Página principal da simulação
│   │   ├── Stations.tsx   # Página de estações OSCE
│   │   └── AdminStations.tsx # Admin para cadastrar estações
│   └── components/        # Componentes UI
├── vercel.json            # Configuração Vercel
├── supabase_stations.sql  # SQL para tabela de estações
└── package.json           # Dependências
```

## 🎯 Como Testar / Deploy

### 1) Variáveis de Ambiente
Crie `.env.local` (local) e configure em `Vercel > Settings > Environment Variables`:

```
OPENAI_API_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 2) Supabase (SQLs iniciais)
Execute no Supabase:
- `api/setup/audio-recordings.sql`
- `api/setup/simulations.sql`
- `api/setup/rls-policies.sql`

### 3) Rodar localmente
```
npm install
npm run dev
```

### 3.1) Autenticação (Google OAuth via Supabase)
- Configure no painel Supabase: Authentication > Providers > Google → Enable Google provider
- Configure no Google Console: OAuth 2.0 Client IDs com callback `https://your-project.supabase.co/auth/v1/callback`
- O app usa apenas a anon key no cliente (`@supabase/supabase-js`) com `persistSession: true` e `autoRefreshToken: true`.
- Fluxo: Clique "Entrar com Google" → popup Google → redireciona para `/dashboard`.
- Sessão persiste no `localStorage` e restaura após reload.

### 3.2) Testes manuais mínimos
- Clique "Entrar com Google" → popup Google → autorizar → redirect `/dashboard`.
- Acessar `/dashboard` deslogado → redirect `/auth`.
- Reload em `/dashboard` logado → permanece logado.
- Mobile: botão Google responsivo e feedbacks de loading/erro.

### 4) Deploy via GitHub → Vercel
1. Suba este repositório para o GitHub
2. Em `Vercel > New Project`, importe o repositório
3. Defina as variáveis acima
4. Deploy

### 5) Rotas principais
- `/` Landing com login/cadastro (modal)
- `/dashboard` Dashboard
- `/dashboard/settings` Configurações
- `/dashboard/schedule` Agendar metas
- `/stations` Estações OSCE
- `/simulation` Fluxos de simulação

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🔐 Implementação de Autenticação (Google OAuth)
- Cliente Supabase: `src/integrations/supabase/client.ts`
  - `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
  - `auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }`
- Hook: `src/hooks/useAuth.ts`
  - Estado: `user | null`, `loading`, `error`
  - Inicializa com `supabase.auth.getSession()` e `onAuthStateChange`
  - `signInWithGoogle()` com `signInWithOAuth({ provider: 'google' })`
  - `signOut()` para logout
  - Normalização de erros OAuth
- Página `/auth`: `src/pages/Auth.tsx`
  - Botão "Entrar com Google" com ícone oficial
  - Redirecionamento automático após OAuth
- Modal Auth: `src/components/AuthModal.tsx`
  - Botão Google integrado no modal da landing
- Guards de rota: `src/App.tsx`
  - Públicas: `/`, `/auth`
  - Privadas: `/dashboard`, `/settings`, etc. Redireciona para `/auth` se não logado
