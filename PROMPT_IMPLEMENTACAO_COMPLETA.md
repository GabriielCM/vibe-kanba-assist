# Prompt Único — Implementação Completa do Vibe Kanban Assist

> **Instrução para Code Agent**: Implemente do zero o sistema descrito abaixo. Use EXATAMENTE as tecnologias, estruturas e lógicas especificadas. A aplicação inteira é em português brasileiro (UI labels, textos, placeholders). Não invente funcionalidades extras. Siga cada seção com fidelidade.

---

## 1. PROJETO E STACK

Crie um projeto React + TypeScript + Vite com Tailwind CSS 4:

```bash
npm create vite@latest vibe-kanba-assist -- --template react-ts
cd vibe-kanba-assist
npm install react react-dom zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react react-router-dom
npm install -D tailwindcss @tailwindcss/vite @vitejs/plugin-react typescript eslint
```

**vite.config.ts**: plugins `@vitejs/plugin-react` e `@tailwindcss/vite`. Server na porta 3000.

**tsconfig.app.json**: target ES2022, strict mode, React JSX.

---

## 2. DESIGN SYSTEM (index.css)

Use Tailwind CSS 4 com `@theme` para variáveis customizadas:

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-hover: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #06b6d4;
}

@layer base {
  body {
    @apply bg-surface-secondary text-text-primary antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  * {
    @apply border-border;
  }
}
```

---

## 3. TYPES (src/types/index.ts)

Defina TODOS os tipos abaixo. Eles são a base de todo o sistema:

```typescript
export type FeatureType = 'feature' | 'bugfix' | 'refactor' | 'enhancement' | 'hotfix'

export type ColumnId =
  | 'input-inicial'
  | 'enriquecimento'
  | 'revisao-prompt'
  | 'execucao'
  | 'revisao-tecnica'
  | 'avaliacao-accuracy'

export interface GeneralSelect {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size: number
}

export interface PromptVersion {
  id: string
  version: number
  content: string
  createdAt: string
  analyzedFiles: string[]
  detectedPatterns: string[]
  structuralSuggestions: string[]
}

export interface CodeOutput {
  id: string
  version: number
  promptVersionId: string
  commitLink: string
  prLink: string
  structuralDiff: string
  createdAt: string
}

export interface TechnicalReview {
  followedPatterns: boolean
  brokeConvention: boolean
  technicalDebt: boolean
  createdDuplication: boolean
  unexpectedFiles: boolean
  notes: string
  reviewedAt: string
}

export interface PromptAccuracy {
  score: number // 1-5
  specificEnough: boolean
  missingContext: boolean
  missingRestrictions: boolean
  missingAcceptanceCriteria: boolean
  agentHadToGuess: boolean
  notes: string
  evaluatedAt: string
}

export type EnrichmentStatus = 'idle' | 'running' | 'done' | 'error'

export interface EnrichmentLogEntry {
  timestamp: string
  step: string
  detail: string
}

export interface FeatureCard {
  id: string
  columnId: ColumnId
  title: string
  description: string
  featureType: FeatureType
  branch: string
  attachments: Attachment[]
  generalSelects: string[]        // IDs of selected GeneralSelects
  acceptanceCriteria: string[]
  promptVersions: PromptVersion[]
  codeOutputs: CodeOutput[]
  technicalReview: TechnicalReview | null
  promptAccuracy: PromptAccuracy | null
  enrichmentStatus: EnrichmentStatus
  enrichmentError: string | null
  enrichmentLogs: EnrichmentLogEntry[]
  enrichmentStep: string
  iterationCount: number
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: ColumnId
  title: string
  description: string
  color: string
}

export interface GeneralRule {
  id: string
  title: string
  content: string
  category: string
  enabled: boolean
  createdAt: string
}

export interface PromptTemplate {
  id: string
  name: string
  featureType: FeatureType
  template: string
  variables: string[]
  createdAt: string
}

export interface PromptExample {
  id: string
  title: string
  prompt: string
  result: string
  score: number
  featureType: FeatureType
  createdAt: string
}

export type ImprovementType = 'template-adjustment' | 'new-select' | 'search-heuristic' | 'evaluation-criteria'
export type ImprovementStatus = 'backlog' | 'in-progress' | 'done'

export interface ImprovementCard {
  id: string
  title: string
  description: string
  type: ImprovementType
  status: ImprovementStatus
  createdAt: string
  completedAt: string | null
}

export interface ApiKeysConfig {
  geminiApiKey: string
  githubClientId: string     // Usado para o GitHub PAT (Personal Access Token)
  githubClientSecret: string
}

export interface GitHubUser {
  login: string
  avatar_url: string
  name: string
  repos_url: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  default_branch: string
  branches_url: string
}

export interface GitHubBranch {
  name: string
}

export type ActiveBoard = 'features' | 'prompt-library' | 'system-improvement'
```

---

## 4. UTILITIES

### 4.1 src/utils/id.ts
```typescript
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
```

### 4.2 src/utils/columns.ts

6 colunas fixas do Kanban principal:

| id | title | color | description |
|----|-------|-------|-------------|
| input-inicial | Input Inicial | #3b82f6 | Formulário de entrada: título, descrição, anexos, tipo, branch, selects |
| enriquecimento | Enriquecimento de Contexto | #8b5cf6 | Gemini analisa input, aplica General Rules, estrutura prompt de alta qualidade |
| revisao-prompt | Revisão Humana do Prompt | #f59e0b | Revisar clareza, especificidade, alinhamento arquitetural, escopo e critérios |
| execucao | Execução pelo Code Agent | #22c55e | Prompt final enviado ao agente de código. Registrar versão, output e commits |
| revisao-tecnica | Revisão Técnica | #06b6d4 | Inspecionar código: padrões, convenções, débito técnico, duplicação |
| avaliacao-accuracy | Avaliação de Accuracy | #ef4444 | Avaliar o PROMPT (não o código): especificidade, contexto, restrições, score 1-5 |

### 4.3 src/utils/enrichment.ts — Pipeline de Enriquecimento

Este é o **núcleo inteligente** do sistema. Implementar EXATAMENTE esta lógica:

**Constantes**:
- `CODE_EXTENSIONS`: `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.svelte`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.css`, `.scss`, `.less`, `.html`, `.json`, `.yaml`, `.yml`, `.toml`
- `CONFIG_FILES`: `package.json`, `tsconfig.json`, `vite.config.ts`, `vite.config.js`, `next.config.js/mjs/ts`, `tailwind.config.js/ts`, `.eslintrc.js/.json`, `eslint.config.js`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`
- `IGNORE_PATHS`: `node_modules`, `dist`, `build`, `.git`, `.next`, `__pycache__`, `vendor`, `target`, `.cache`, `coverage`, `.turbo`, `.vercel`

**Funções helper**:
- `shouldIgnore(path)`: retorna true se path começa com algum IGNORE_PATH + '/'
- `isCodeFile(path)`: retorna true se path termina com alguma CODE_EXTENSION
- `isConfigFile(path)`: verifica se filename (última parte do path) está em CONFIG_FILES
- `scoreRelevance(filePath, keywords)`: score += 3 para cada keyword encontrada no path.toLowerCase(); +1 se começa com 'src/'; +1 se contém 'component', 'page', ou 'view'
- `extractKeywords(card)`: combina title + description, remove stopwords (PT + EN), filtra palavras >= 3 chars, retorna até 20 keywords

**Função `fetchRepoTree(repoFullName, branch, token)`**:
- GET `https://api.github.com/repos/{repoFullName}/git/trees/{branch}?recursive=1`
- Headers: `Authorization: Bearer {token}`, `Accept: application/vnd.github.v3+json`
- Retorna `{ tree: GitHubTreeItem[], truncated: boolean }`

**Função `fetchFileContent(repoFullName, path, branch, token)`**:
- **IMPORTANTE sobre CORS**: NÃO usar `raw.githubusercontent.com` — ele bloqueia CORS quando Authorization header está presente (preflight OPTIONS retorna 403).
- Usar `https://api.github.com/repos/{repoFullName}/contents/{encodedPath}?ref={branch}`
- Encodar cada segmento do path INDIVIDUALMENTE: `path.split('/').map(encodeURIComponent).join('/')`
- Headers: `Authorization: Bearer {token}`, `Accept: application/vnd.github.raw+json` (retorna texto puro, sem base64)
- NÃO enviar `X-GitHub-Api-Version` header (não está na CORS allowlist e causa falha no preflight)
- Truncar para 200 linhas máximo

**Função `callGemini(apiKey, prompt)`**:
- POST `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Header: `x-goog-api-key: {apiKey}` (NÃO usar query string)
- Body: `{ contents: [{ parts: [{ text: prompt }] }] }`
- Retorna: `data.candidates[0].content.parts[0].text`

**Função principal `runEnrichmentPipeline(card, repoFullName, githubToken, geminiApiKey, generalRules, generalSelects, callbacks)`**:

Pipeline de 7 passos, usando `callbacks.onLog(step, detail)` e `callbacks.onStep(description)`:

1. **Fetch repo tree**: busca árvore recursiva, separa em allFiles, codeFiles, configFiles
2. **Detect project structure**: extrai top-level e second-level directories
3. **Read config files**: lê até 5 configs, loga sucesso/falha de cada
4. **Find relevant files**: pontua codeFiles por keyword relevance, pega top 10; se < 3 resultados, complementa com arquivos de src/
5. **Read relevant file contents**: lê até 8 arquivos, loga progresso
6. **Detect patterns**: string matching no conteúdo concatenado para detectar: Tailwind CSS, React Hooks, Zustand, Express.js, Next.js, Vue.js, TypeScript, CSS Modules, Styled Components, e extrai deps do package.json
7. **Build prompt e call Gemini**: monta o prompt abaixo e envia ao Gemini

**Prompt enviado ao Gemini** (construir EXATAMENTE assim):

```
Você é um engenheiro de prompt especializado. Você DEVE gerar instruções baseadas no código REAL do repositório fornecido abaixo.

REGRAS GERAIS (Constituição):
{activeRules.map(r => `- ${r.title}: ${r.content}`).join('\n') || '(nenhuma regra configurada)'}

MODIFICADORES ATIVOS (General Selects):
{activeSelects.map(s => `- ${s.name}: ${s.description}`).join('\n') || '(nenhum modificador ativo)'}

===========================
ESTRUTURA DO REPOSITÓRIO
===========================
Diretórios: {topDirs.join(', ')}
Total de arquivos de código: {codeFiles.length}
Padrões detectados: {detectedPatterns.join(', ')}

===========================
ARQUIVOS DE CONFIGURAÇÃO
===========================
{configContextBlock || '(nenhum encontrado)'}

===========================
CÓDIGO RELEVANTE (REAL)
===========================
{fileContextBlock || '(nenhum arquivo relevante encontrado)'}

===========================
FEATURE REQUEST
===========================
Título: {card.title}
Descrição: {card.description}
Tipo: {card.featureType}
Branch: {branch}
Critérios de Aceite: {card.acceptanceCriteria.join('\n- ') || '(nenhum definido)'}

===========================
INSTRUÇÃO
===========================
Com base no código REAL acima, gere:

1. **PROMPT OTIMIZADO**: Prompt específico para um code agent executar esta feature. Referencie ARQUIVOS REAIS, PADRÕES REAIS, NOMES DE COMPONENTES REAIS encontrados no repositório.

2. **ARQUIVOS QUE SERÃO AFETADOS**: Lista exata de arquivos existentes no repo que precisam ser modificados/criados.

3. **PADRÕES DETECTADOS QUE DEVEM SER SEGUIDOS**: Naming conventions, estrutura de pastas, patterns de componentes que o code agent DEVE respeitar.

4. **SUGESTÕES DE MELHORIA ESTRUTURAL**: Se o código atual tem problemas que seriam agravados pela feature.

IMPORTANTE: Não invente nomes de arquivos. Use APENAS caminhos que existem no repositório ou derive novos caminhos seguindo o padrão existente.
```

Retornar `EnrichmentResult` com: prompt (texto do Gemini), analyzedFiles (configs + code files lidos), detectedPatterns, structuralSuggestions (vazio por ora).

---

## 5. ZUSTAND STORES (todos com `persist` middleware → localStorage)

### 5.1 useSettingsStore (key: 'vibe-kanban-settings')

**Estado**:
- `activeBoard: ActiveBoard` (default: 'features')
- `apiKeys: ApiKeysConfig` (default: strings vazias)
- `githubUser: GitHubUser | null`
- `githubRepos: GitHubRepo[]`
- `selectedRepo: GitHubRepo | null`
- `branches: GitHubBranch[]`
- `sidebarOpen: boolean` (default: true)

**Actions**: setActiveBoard, setApiKeys (partial merge), setGithubUser, setGithubRepos, setSelectedRepo, setBranches, toggleSidebar.

**Partialize**: persistir apenas activeBoard, apiKeys, sidebarOpen, githubUser, githubRepos, selectedRepo, branches.

### 5.2 useFeaturesStore (key: 'vibe-kanban-features')

**Estado**: `cards: FeatureCard[]`

**Actions**:
- `addCard(card)`: gera id, seta timestamps, inicializa arrays vazios, enrichmentStatus='idle', iterationCount=0. Retorna o id.
- `updateCard(id, updates)`: merge parcial + updatedAt
- `moveCard(id, toColumn)`: atualiza columnId + updatedAt
- `deleteCard(id)`: remove do array
- `addPromptVersion(cardId, prompt)`: adiciona nova version (auto-incrementa version number)
- `addCodeOutput(cardId, output)`: adiciona novo output (auto-incrementa version)
- `setTechnicalReview(cardId, review)`: seta o campo
- `setPromptAccuracy(cardId, accuracy)`: seta o campo
- `incrementIteration(cardId)`: iterationCount++
- `setEnrichmentStatus(cardId, status, error?)`: atualiza status e erro
- `addEnrichmentLog(cardId, step, detail)`: adiciona 1 entry
- `addEnrichmentLogs(cardId, entries)`: adiciona batch (para performance)
- `setEnrichmentStep(cardId, step)`: atualiza step description
- `clearEnrichmentLogs(cardId)`: limpa logs, step, mantém status e error
- `getCardsByColumn(columnId)`: filtra cards

**IMPORTANTE — Migração**: usar `merge` no persist para preencher campos novos com defaults quando cards antigos não os possuem:
```typescript
merge: (persisted, current) => {
  // ... auto-fill enrichmentStatus, enrichmentLogs, etc. com defaults
}
```

### 5.3 usePromptsStore (key: 'vibe-kanban-prompts')

**Estado**:
- `generalRules: GeneralRule[]` (default: vazio)
- `generalSelects: GeneralSelect[]` (default: 5 selects pré-configurados):
  - 'Strict Patterns' / 'Forçar aderência estrita aos padrões existentes' (enabled: true)
  - 'Minimal Changes' / 'Minimizar alterações, apenas o necessário' (enabled: false)
  - 'With Tests' / 'Incluir testes unitários no output' (enabled: false)
  - 'DRY Principle' / 'Eliminar duplicações agressivamente' (enabled: false)
  - 'No New Dependencies' / 'Não introduzir novas dependências' (enabled: false)
- `templates: PromptTemplate[]` (default: vazio)
- `examples: PromptExample[]` (default: vazio)

**Actions**: CRUD completo para cada entidade (add, update, delete).

### 5.4 useImprovementsStore (key: 'vibe-kanban-improvements')

**Estado**: `cards: ImprovementCard[]`

**Actions**:
- `addCard(card)`: gera id, timestamp, completedAt=null
- `updateStatus(id, status)`: atualiza status; se 'done' seta completedAt
- `deleteCard(id)`: remove
- `getByStatus(status)`, `getByType(type)`: filtros

---

## 6. HOOK: useAutoEnrichment

Custom hook que monitora cards na coluna 'enriquecimento' e auto-dispara o pipeline.

**Lógica crítica**:
1. Observa `cards` e `geminiApiKey` via selectors do store
2. Filtra cards com `columnId === 'enriquecimento'` AND `enrichmentStatus === 'idle'`
3. Usa `processingRef` (Set<string>) para evitar double-processing
4. Para cada card elegível:
   - Adiciona id ao processingRef
   - Chama `processCard(cardId)` que:
     - Lê estado fresco via `getState()` (evita stale closures)
     - Implementa **log batching**: buffer + flush a cada 150ms via setInterval
     - Se `hasGitHub` (token + selectedRepo): chama `runEnrichmentPipeline`
     - Senão: **fallback** — chama Gemini direto com prompt simplificado sem código do repo
     - Em sucesso: `addPromptVersion`, `incrementIteration`, `setEnrichmentStatus('done')`
     - Em erro: loga erro, `setEnrichmentStatus('error', message)`
     - Em `finally`: remove do processingRef (permite re-processamento via "Regenerar")

---

## 7. COMPONENTES — LAYOUT

### 7.1 Sidebar

- Sidebar colapsável: `w-64` (aberto) / `w-16` (fechado), com transição
- Botão toggle no topo (ChevronLeft / ChevronRight)
- 3 itens de navegação:
  - "Gestão de Features" (ícone Layout)
  - "Biblioteca de Prompts" (ícone BookOpen)
  - "Melhoria do Sistema" (ícone Settings)
- Item ativo: bg-primary-50, text-primary-700
- Seção inferior: botões Métricas (BarChart3) e Configurações (Settings)
- Seção GitHub: se `sidebarOpen && githubUser`, exibe avatar (32px rounded-full), name, login

### 7.2 Header

- Título e descrição variam por board ativo:
  - features: "Gestão de Features" / "Kanban para desenvolvimento orientado a prompts"
  - prompt-library: "Biblioteca de Prompts" / "General Rules, Selects, Templates e Exemplos"
  - system-improvement: "Melhoria do Sistema" / "Backlog de melhorias identificadas"
- Botão "Connect GitHub" (se !githubUser)
- Botão "Nova Feature" (só no board features)
- Botão Settings (ícone Settings)

---

## 8. COMPONENTES — KANBAN BOARD (Board 1)

### 8.1 KanbanBoard

- Wrapper `DndContext` com `PointerSensor` (activationConstraint: distance: 8), `closestCorners`
- `cardsByColumn`: memo que mapeia COLUMNS → cards filtradas
- `handleDragEnd`: extrai columnId do over (pode ser coluna ou card), chama `moveCard`
- `DragOverlay`: mostra card sendo arrastado
- Modais: `NewCardForm` e `CardDetail` (controlados por state)

### 8.2 KanbanColumn

- Largura fixa `min-w-[300px] max-w-[300px]`
- Header: dot colorido (style backgroundColor = column.color), título, badge com contagem
- Area de drop: `min-h-[200px]`, visual feedback com bg-primary-50 e border-dashed quando hover
- `SortableContext` wrapping cards
- Estado vazio: "Arraste cards para cá" (texto muted)

### 8.3 KanbanCard

- Card arrastável via `useSortable`
- Conteúdo:
  - **Linha 1**: título (line-clamp-2) + badge do accuracy score (se existir)
    - Score >= 4: bg-green-100 text-green-700
    - Score >= 3: bg-yellow-100 text-yellow-700
    - Else: bg-red-100 text-red-700
  - **Linha 2**: descrição (line-clamp-2, text-xs, text-text-muted)
  - **Status de enriquecimento** (condicional):
    - `running`: box purple com Loader2 animado + step + último log
    - `done`: box green com CheckCircle + "Enriquecido" + contagem de arquivos
    - `error`: box red com AlertCircle + mensagem de erro
  - **Footer**: badge featureType (cores por tipo), branch (GitBranch icon, max-w-[100px] truncate), iterationCount (IterationCcw icon), promptVersion count (Tag icon)

**Cores de featureType**:
- feature: bg-blue-100 text-blue-700
- bugfix: bg-red-100 text-red-700
- refactor: bg-purple-100 text-purple-700
- enhancement: bg-green-100 text-green-700
- hotfix: bg-orange-100 text-orange-700

### 8.4 CardDetail (Modal)

- Modal fullscreen-like (inset-0, z-50) com backdrop
- Header: dot colorido da coluna atual, título do card, nome da coluna, botões de navegação (ChevronLeft/Right para avançar/regredir coluna)
- **6 tabs** mapeadas para as 6 colunas:
  - info → "Info" (ícone FileText)
  - enriquecimento → "Enriquecimento" (ícone Zap)
  - revisao-prompt → "Revisão" (ícone Eye)
  - execucao → "Execução" (ícone Play)
  - revisao-tecnica → "Rev. Técnica" (ícone Shield)
  - avaliacao-accuracy → "Avaliação" (ícone Star)
- Tab ativa inicia na coluna atual do card
- **Tab Info**: tipo, branch, versão, iterações, descrição (whitespace-pre-wrap), critérios de aceite (com CheckCircle), general selects como badges, data de criação, botão deletar (com confirm)

### 8.5 EnrichmentPanel

- Descrição explicativa do que é o enriquecimento
- Botão "Iniciar Enriquecimento" (se status idle/error) ou "Regenerar" (se done)
- Warnings em box amarela:
  - Se !geminiApiKey: "Configure a API Key do Gemini"
  - Se !selectedRepo: "Conecte um repositório GitHub" (não bloqueia, apenas avisa)
- **Step indicator**: box purple com Loader2 spinner + texto do step atual
- **Terminal de logs**: visual estilo terminal (bg-gray-900/950, monospace, dots red/yellow/green no header)
  - Cada log line: `[HH:MM:SS]` + prefixo colorido por step:
    - error → text-red-400
    - warn → text-yellow-400
    - done → text-green-400
    - default → text-gray-300
  - Auto-scroll para o final via useRef + useEffect
- **Arquivos analisados**: badges com filepath (text-xs, bg-gray-100)
- **Padrões detectados**: badges (text-xs, bg-purple-100)
- **Prompt versions**: accordion com version number, timestamp, conteúdo pre-formatted (max-h-[300px] overflow-y-auto)
- Botão "Regenerar": limpa logs e seta status para 'idle' (re-triggera o pipeline via hook)

### 8.6 PromptReviewPanel

- Checklist de revisão com 7 itens (grid 2 colunas):
  1. "Está claro?"
  2. "Está específico?"
  3. "Está alinhado com arquitetura?"
  4. "Está pedindo coisa demais?"
  5. "Está respeitando escopo?"
  6. "Inclui critérios de aceite?"
  7. "Está seguro?"
- Cada item: checkbox toggleável
- Prompt display: pre-formatted, monospace, max-h-[300px], overflow-y-auto
- Botão "Editar Prompt": abre textarea para edição
- Botão "Salvar como nova versão": cria PromptVersion preservando analyzedFiles, detectedPatterns, structuralSuggestions da versão anterior + incrementa iteration
- Alert se não existe prompt ainda

### 8.7 ExecutionPanel

- Exibe prompt mais recente em box (bg-purple-50, max-h-[150px], overflow)
- Formulário para registrar output:
  - Commit Link (input com ícone GitCommit)
  - PR Link (input com ícone Link)
  - Structural Diff (textarea, 3 rows)
- Botão "Registrar Output": chama addCodeOutput, limpa campos
- Histórico de outputs anteriores: lista com version, timestamp (pt-BR), commit link, PR link, diff
- Alert se não existe prompt

### 8.8 TechnicalReviewPanel

- 5 itens de checklist, cada um com botões Sim/Não:
  - "Seguiu padrões existentes?" (followedPatterns) — positivo: bom se TRUE
  - "Quebrou convenção?" (brokeConvention) — negativo: bom se FALSE
  - "Introduziu débito técnico?" (technicalDebt) — negativo
  - "Criou duplicação?" (createdDuplication) — negativo
  - "Alterou arquivos não previstos?" (unexpectedFiles) — negativo
- Visual: Sim = CheckCircle green-100, Não = XCircle red-100
- Textarea para notas (4 rows)
- Botão "Salvar Revisão" (cyan-600)
- Exibe timestamp da última revisão

### 8.9 AccuracyPanel

- **5-star rating system**: ícones Star clicáveis, preenchimento visual
- Display "X/5" (texto grande e bold)
- Warning box (yellow) se score <= 2: "Avaliações baixas geram automaticamente cards de melhoria"
- **5 perguntas** com checkboxes:
  1. "O prompt foi suficientemente específico?" (specificEnough)
  2. "Faltou contexto?" (missingContext)
  3. "Faltaram restrições?" (missingRestrictions)
  4. "Faltaram critérios de aceite?" (missingAcceptanceCriteria)
  5. "O agent teve que 'adivinhar' coisas?" (agentHadToGuess)
- Textarea para notas (3 rows)
- Botão "Salvar Avaliação" (red-600)
- Métricas de iteração com badge colorido:
  - <= 2: "Bom" (green-100)
  - <= 4: "Atenção" (yellow-100)
  - else: "Especificação fraca" (red-100)
- **FUNCIONALIDADE CRÍTICA**: Se score <= 2, automaticamente criar ImprovementCard no store de improvements:
  - title: "Refinar template: {cardTitle}"
  - description: "Score {score}/5. Notas: {notes}"
  - type: 'template-adjustment'
  - status: 'backlog'

---

## 9. COMPONENTES — FORMULÁRIO DE NOVO CARD

### NewCardForm (Modal)

Campos:
- **Título** (input text, required)
- **Descrição detalhada** (textarea, 5 rows, required)
- **Tipo de feature** (select): Feature, Bugfix, Refactor, Enhancement, Hotfix
- **Branch**: se GitHub repo conectado E branches carregadas → select dropdown. Senão → input text livre. Auto-fetch de branches via GitHub API ao abrir se selectedRepo existe.
- **General Selects**: botões toggle para cada select disponível. Selecionados ficam com bg-primary-100 border-primary-300.
- **Critérios de aceite**: lista dinâmica. Botão "Adicionar Critério" (Plus icon). Cada critério: input + botão remover (Trash2). Inicializa com 1 critério vazio.
- Botões: "Criar Feature" (submete com columnId='input-inicial') e "Cancelar"

---

## 10. COMPONENTES — SETTINGS

### SettingsModal (Modal com 2 tabs)

**Tab 1: API Keys**
- Input para Gemini API Key (password/text toggle com Eye/EyeOff)
- Botão "Salvar e Verificar Conexão":
  - Faz POST de teste ao Gemini com prompt "Olá"
  - Se sucesso: persiste key, mostra status verde "Conectado!"
  - Se erro: mostra status vermelho com mensagem
- StatusBadge: idle (nada), validating (Loader2 animado), success (CheckCircle verde), error (AlertCircle vermelho)
- Display da key salva (primeiros 8 chars + "...")

**Tab 2: GitHub**
- Input para GitHub PAT (password/text toggle)
- Botão "Salvar e Verificar Conexão":
  - GET `api.github.com/user` com Bearer token → valida e pega user info
  - GET `api.github.com/user/repos?per_page=100&sort=updated` → lista repos
  - Persiste user, repos, limpa selectedRepo
- Quando conectado:
  - Card do user: avatar (48px), name, login
  - Botão "Desconectar" (LogOut icon): limpa tudo (user, repos, selectedRepo, branches, token)
  - Select de repositório (dropdown com full_name de cada repo)
  - Ao selecionar repo: auto-fetch branches via `repos/{full_name}/branches?per_page=100`
  - Exibe repo selecionado com full_name e default_branch

---

## 11. COMPONENTES — MÉTRICAS

### MetricsPanel

- **4 KPIs em grid** (4 colunas):
  1. "Total de Features" (Target icon) — cards.length
  2. "Média de Iterações" (IterationCcw icon) — média de iterationCount. Texto: "Excelente" se <= 2, "Pode melhorar" se <= 4, "Especificação fraca" se > 4
  3. "Score Médio" (BarChart3 icon) — média de promptAccuracy.score (X/5)
  4. "Avaliados" (TrendingUp icon) — contagem de cards com accuracy / total

- **Distribuição de iterações** (3 colunas):
  - "Bom" (green-50): 1-2 iterações
  - "Atenção" (yellow-50): 3-4 iterações
  - "Fraco" (red-50): 5+ iterações

- **Meta do sistema** (primary-50 box): "1 geração → 1 pequeno ajuste → pronto"

---

## 12. PÁGINAS

### 12.1 PromptLibrary (Board 2)

4 tabs: Rules, Selects, Templates, Examples.

**Rules Section** ("General Rules — Constituição"):
- Lista de regras com: título, categoria (badge), conteúdo, toggle enable/disable (ToggleLeft/ToggleRight icon), delete
- Form: título + conteúdo (textarea 3 rows) + categoria

**Selects Section** ("General Selects"):
- Grid 2 colunas de selects: nome, toggle, delete, descrição
- Form: nome + descrição (textarea 2 rows)
- Default enabled = false ao criar

**Templates Section** ("Templates de Prompt"):
- Cards: nome, featureType badge (blue-100), template preview (pre, max-h-[120px]), delete
- Form: nome + featureType select + template (textarea 6 rows, monospace, menção a {{variáveis}})

**Examples Section** ("Exemplos de Prompts"):
- Cards: título, featureType badge, 5-star display, prompt preview (pre, max-h-[100px]), resultado, delete
- Form: título + featureType select + prompt (textarea 4 rows, monospace) + result (textarea 3 rows) + 5-star rating clicável

### 12.2 SystemImprovement (Board 3)

Kanban simplificado com 3 colunas:

| Status | Título | Cor do dot |
|--------|--------|-----------|
| backlog | Backlog | #94a3b8 |
| in-progress | Em Progresso | #f59e0b |
| done | Concluído | #22c55e |

- Botão "Nova Melhoria" com form: título + descrição (textarea 3 rows) + tipo (select: template-adjustment, new-select, search-heuristic, evaluation-criteria)
- Cards mostram: título, descrição (line-clamp-2), badge do tipo com cores:
  - template-adjustment → purple-100 "Ajustar Template"
  - new-select → blue-100 "Novo Select"
  - search-heuristic → orange-100 "Heurística de Busca"
  - evaluation-criteria → green-100 "Critérios de Avaliação"
- Botão avançar: backlog → in-progress → done (ArrowRight, ou CheckCircle no último passo)
- Botão deletar (Trash2)

---

## 13. APP.tsx — COMPOSIÇÃO FINAL

```tsx
export default function App() {
  const { activeBoard } = useSettingsStore()
  const [showNewCard, setShowNewCard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMetrics] = useState(false)

  useAutoEnrichment() // Auto-trigger

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onNewCard={activeBoard === 'features' ? () => setShowNewCard(true) : undefined}
          onOpenSettings={() => setShowSettings(true)}
        />
        <main className="flex-1 overflow-hidden">
          {activeBoard === 'features' && !showMetrics && (
            <KanbanBoard showNewCard={showNewCard} onCloseNewCard={() => setShowNewCard(false)} />
          )}
          {activeBoard === 'features' && showMetrics && <MetricsPanel />}
          {activeBoard === 'prompt-library' && <PromptLibrary />}
          {activeBoard === 'system-improvement' && <SystemImprovement />}
        </main>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
```

---

## 14. ESTRUTURA FINAL DE PASTAS

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── types/
│   └── index.ts
├── utils/
│   ├── id.ts
│   ├── columns.ts
│   └── enrichment.ts
├── store/
│   ├── settings.ts
│   ├── features.ts
│   ├── prompts.ts
│   └── improvements.ts
├── hooks/
│   └── useAutoEnrichment.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   └── KanbanCard.tsx
│   ├── forms/
│   │   ├── CardDetail.tsx
│   │   ├── NewCardForm.tsx
│   │   ├── EnrichmentPanel.tsx
│   │   ├── PromptReviewPanel.tsx
│   │   ├── ExecutionPanel.tsx
│   │   ├── TechnicalReviewPanel.tsx
│   │   └── AccuracyPanel.tsx
│   ├── settings/
│   │   └── SettingsModal.tsx
│   └── metrics/
│       └── MetricsPanel.tsx
└── pages/
    ├── PromptLibrary.tsx
    └── SystemImprovement.tsx
```

---

## 15. REGRAS GERAIS DE IMPLEMENTAÇÃO

1. **Sem backend** — tudo roda no browser. localStorage para persistência.
2. **Sem .env** — API keys inseridas via Settings Modal.
3. **Ícones**: usar APENAS lucide-react. Ícones usados: Layout, BookOpen, Settings, BarChart3, ChevronLeft, ChevronRight, Plus, Trash2, X, Star, GitBranch, Tag, Zap, Eye, Play, Shield, FileText, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2, IterationCcw, Target, TrendingUp, GitCommit, Link, LogOut, ToggleLeft, ToggleRight, ArrowRight.
4. **Drag and drop**: @dnd-kit com PointerSensor (8px distance), closestCorners, DragOverlay.
5. **Responsivo**: usar classes Tailwind para breakpoints.
6. **Sem emojis** na UI.
7. **Toda** UI em português brasileiro.
8. **Build**: deve compilar limpo com `tsc -b && vite build`.
