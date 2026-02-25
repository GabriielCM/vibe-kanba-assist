import type { FeatureCard, GeneralRule, GeneralSelect } from '../types'

interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
}

export interface EnrichmentCallbacks {
  onLog: (step: string, detail: string) => void
  onStep: (stepDescription: string) => void
}

export interface EnrichmentResult {
  prompt: string
  analyzedFiles: string[]
  detectedPatterns: string[]
  structuralSuggestions: string[]
}

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
  '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.css', '.scss', '.less', '.html',
  '.json', '.yaml', '.yml', '.toml',
]

const CONFIG_FILES = [
  'package.json', 'tsconfig.json', 'vite.config.ts', 'vite.config.js',
  'next.config.js', 'next.config.mjs', 'next.config.ts',
  'tailwind.config.js', 'tailwind.config.ts',
  '.eslintrc.js', '.eslintrc.json', 'eslint.config.js',
  'pyproject.toml', 'Cargo.toml', 'go.mod', 'Gemfile',
]

const IGNORE_PATHS = [
  'node_modules', 'dist', 'build', '.git', '.next', '__pycache__',
  'vendor', 'target', '.cache', 'coverage', '.turbo', '.vercel',
]

function shouldIgnore(path: string): boolean {
  return IGNORE_PATHS.some((p) => path.startsWith(p + '/') || path === p)
}

function isCodeFile(path: string): boolean {
  return CODE_EXTENSIONS.some((ext) => path.endsWith(ext))
}

function isConfigFile(path: string): boolean {
  const filename = path.split('/').pop() || ''
  return CONFIG_FILES.includes(filename)
}

function scoreRelevance(filePath: string, keywords: string[]): number {
  const lower = filePath.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += 3
  }
  if (lower.startsWith('src/')) score += 1
  if (lower.includes('component') || lower.includes('page') || lower.includes('view')) score += 1
  return score
}

function extractKeywords(card: FeatureCard): string[] {
  const text = `${card.title} ${card.description}`.toLowerCase()
  const stopWords = new Set(['que', 'para', 'com', 'uma', 'por', 'não', 'dos', 'das', 'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'are', 'was', 'will', 'should', 'must', 'can'])
  return text
    .replace(/[^a-záàâãéèêíïóôõúç\w]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))
    .slice(0, 20)
}

/**
 * Fetch repo tree from GitHub Git Trees API.
 */
async function fetchRepoTree(repoFullName: string, branch: string, token: string): Promise<{ tree: GitHubTreeItem[]; truncated: boolean }> {
  const url = `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub Trees API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

/**
 * Fetch raw file content using GitHub Contents API.
 *
 * IMPORTANT: raw.githubusercontent.com does NOT support CORS when Authorization header
 * is sent (browser does OPTIONS preflight → gets 403). api.github.com DOES support CORS.
 *
 * Uses Accept: application/vnd.github.raw+json to get plain text directly (no base64).
 * Path segments are encoded individually — encoding the full path turns "/" into "%2F" which 404s.
 * Does NOT send X-GitHub-Api-Version header — it's not in CORS allowed headers and causes preflight failure.
 */
async function fetchFileContent(repoFullName: string, path: string, branch: string, token: string): Promise<string> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const url = `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}?ref=${branch}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
    },
  })
  if (!res.ok) {
    console.warn(`[enrichment] Failed to fetch ${path}: HTTP ${res.status} from ${url}`)
    return ''
  }
  const text = await res.text()
  // Limit to 200 lines to not blow up Gemini context
  const lines = text.split('\n')
  if (lines.length > 200) {
    return lines.slice(0, 200).join('\n') + `\n\n... (truncado, ${lines.length} linhas total)`
  }
  return text
}

/**
 * Call Gemini API using x-goog-api-key header (not query string).
 */
async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini API ${res.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do Gemini'
}

/**
 * Main enrichment pipeline — fetches real code from GitHub repo and sends to Gemini.
 */
export async function runEnrichmentPipeline(
  card: FeatureCard,
  repoFullName: string,
  githubToken: string,
  geminiApiKey: string,
  generalRules: GeneralRule[],
  generalSelects: GeneralSelect[],
  callbacks: EnrichmentCallbacks,
): Promise<EnrichmentResult> {
  const branch = card.branch || 'main'
  const keywords = extractKeywords(card)

  // ===== STEP 1: Fetch repo tree =====
  callbacks.onStep('Buscando estrutura do repositório...')
  callbacks.onLog('tree', `GET /repos/${repoFullName}/git/trees/${branch}?recursive=1`)

  const treeData = await fetchRepoTree(repoFullName, branch, githubToken)

  const allFiles = treeData.tree.filter((item) => item.type === 'blob' && !shouldIgnore(item.path))
  const codeFiles = allFiles.filter((f) => isCodeFile(f.path))
  const configFiles = allFiles.filter((f) => isConfigFile(f.path))

  callbacks.onLog('tree', `${allFiles.length} arquivos encontrados, ${codeFiles.length} código, ${configFiles.length} config`)
  if (treeData.truncated) {
    callbacks.onLog('warn', 'Repo muito grande — árvore truncada pela API')
  }

  // ===== STEP 2: Detect project structure =====
  callbacks.onStep('Analisando estrutura do projeto...')

  const dirs = new Set<string>()
  for (const f of allFiles) {
    const parts = f.path.split('/')
    if (parts.length > 1) dirs.add(parts[0])
    if (parts.length > 2) dirs.add(parts.slice(0, 2).join('/'))
  }
  const topDirs = Array.from(dirs).sort()
  callbacks.onLog('structure', `Diretórios: ${topDirs.slice(0, 15).join(', ')}`)

  // ===== STEP 3: Read config files =====
  callbacks.onStep('Lendo arquivos de configuração...')
  const configContents: Record<string, string> = {}
  let successCount = 0

  for (const cf of configFiles.slice(0, 5)) {
    callbacks.onLog('read', `Lendo ${cf.path}...`)
    try {
      const content = await fetchFileContent(repoFullName, cf.path, branch, githubToken)
      if (content) {
        configContents[cf.path] = content
        callbacks.onLog('read', `✓ ${cf.path} (${content.split('\n').length} linhas)`)
        successCount++
      } else {
        callbacks.onLog('warn', `✗ ${cf.path} — falha ao ler`)
      }
    } catch (e) {
      callbacks.onLog('warn', `✗ ${cf.path} — ${e instanceof Error ? e.message : 'erro'}`)
    }
  }
  callbacks.onLog('read', `${successCount}/${configFiles.slice(0, 5).length} configs lidos com sucesso`)

  // ===== STEP 4: Find relevant files =====
  callbacks.onStep('Identificando arquivos relevantes para a feature...')

  const scored = codeFiles.map((f) => ({
    path: f.path,
    score: scoreRelevance(f.path, keywords),
  }))
  scored.sort((a, b) => b.score - a.score)

  const relevantFiles = scored.filter((f) => f.score > 0).slice(0, 10)

  // If we didn't find much by keyword, take some representative files
  if (relevantFiles.length < 3) {
    const srcFiles = codeFiles.filter((f) => f.path.startsWith('src/')).slice(0, 5)
    for (const sf of srcFiles) {
      if (!relevantFiles.find((r) => r.path === sf.path)) {
        relevantFiles.push({ path: sf.path, score: 0 })
      }
    }
  }

  callbacks.onLog('relevance', `${relevantFiles.length} arquivos relevantes identificados por keywords: [${keywords.slice(0, 8).join(', ')}]`)

  // ===== STEP 5: Read relevant file contents =====
  callbacks.onStep('Lendo código dos arquivos relevantes...')
  const fileContents: Record<string, string> = {}
  let codeSuccessCount = 0

  for (const rf of relevantFiles.slice(0, 8)) {
    callbacks.onLog('read', `Lendo ${rf.path}...`)
    try {
      const content = await fetchFileContent(repoFullName, rf.path, branch, githubToken)
      if (content) {
        fileContents[rf.path] = content
        callbacks.onLog('read', `✓ ${rf.path} (${content.split('\n').length} linhas)`)
        codeSuccessCount++
      } else {
        callbacks.onLog('warn', `✗ ${rf.path} — falha ao ler`)
      }
    } catch (e) {
      callbacks.onLog('warn', `✗ ${rf.path} — ${e instanceof Error ? e.message : 'erro'}`)
    }
  }
  callbacks.onLog('read', `${codeSuccessCount}/${relevantFiles.slice(0, 8).length} arquivos lidos com sucesso`)

  // ===== STEP 6: Detect patterns =====
  callbacks.onStep('Detectando padrões e convenções...')

  const allContent = Object.values(fileContents).join('\n')
  const detectedPatterns: string[] = []

  if (allContent.includes('tailwind') || allContent.includes('className=')) detectedPatterns.push('Tailwind CSS')
  if (allContent.includes('useState') || allContent.includes('useEffect')) detectedPatterns.push('React Hooks')
  if (allContent.includes('zustand') || allContent.includes('create(')) detectedPatterns.push('Zustand')
  if (allContent.includes('express') || allContent.includes('app.get(')) detectedPatterns.push('Express.js')
  if (allContent.includes('next/') || allContent.includes('getServerSideProps')) detectedPatterns.push('Next.js')
  if (allContent.includes('vue') || allContent.includes('defineComponent')) detectedPatterns.push('Vue.js')
  if (allContent.includes('interface ') || allContent.includes(': string')) detectedPatterns.push('TypeScript')
  if (allContent.includes('.module.css') || allContent.includes('.module.scss')) detectedPatterns.push('CSS Modules')
  if (allContent.includes('styled(') || allContent.includes('styled.')) detectedPatterns.push('Styled Components')
  if (configContents['package.json']) {
    try {
      const pkg = JSON.parse(configContents['package.json'])
      if (pkg.dependencies) {
        const deps = Object.keys(pkg.dependencies)
        detectedPatterns.push(`Deps: ${deps.slice(0, 10).join(', ')}`)
      }
    } catch { /* ignore */ }
  }

  callbacks.onLog('patterns', `Padrões detectados: ${detectedPatterns.join(', ') || 'nenhum'}`)

  // ===== STEP 7: Build context and call Gemini =====
  callbacks.onStep('Gerando prompt com Gemini (com contexto real do repo)...')

  const activeRules = generalRules.filter((r) => r.enabled)
  const activeSelects = generalSelects.filter((s) => (card.generalSelects || []).includes(s.id))

  const fileContextBlock = Object.entries(fileContents)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n')

  const configContextBlock = Object.entries(configContents)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n')

  const geminiPrompt = `Você é um engenheiro de prompt especializado. Você DEVE gerar instruções baseadas no código REAL do repositório fornecido abaixo.

REGRAS GERAIS (Constituição):
${activeRules.map((r) => `- ${r.title}: ${r.content}`).join('\n') || '(nenhuma regra configurada)'}

MODIFICADORES ATIVOS (General Selects):
${activeSelects.map((s) => `- ${s.name}: ${s.description}`).join('\n') || '(nenhum modificador ativo)'}

===========================
ESTRUTURA DO REPOSITÓRIO
===========================
Diretórios: ${topDirs.join(', ')}
Total de arquivos de código: ${codeFiles.length}
Padrões detectados: ${detectedPatterns.join(', ')}

===========================
ARQUIVOS DE CONFIGURAÇÃO
===========================
${configContextBlock || '(nenhum encontrado)'}

===========================
CÓDIGO RELEVANTE (REAL)
===========================
${fileContextBlock || '(nenhum arquivo relevante encontrado)'}

===========================
FEATURE REQUEST
===========================
Título: ${card.title}
Descrição: ${card.description}
Tipo: ${card.featureType}
Branch: ${branch}
Critérios de Aceite: ${card.acceptanceCriteria.join('\n- ') || '(nenhum definido)'}

===========================
INSTRUÇÃO
===========================
Com base no código REAL acima, gere:

1. **PROMPT OTIMIZADO**: Prompt específico para um code agent executar esta feature. Referencie ARQUIVOS REAIS, PADRÕES REAIS, NOMES DE COMPONENTES REAIS encontrados no repositório.

2. **ARQUIVOS QUE SERÃO AFETADOS**: Lista exata de arquivos existentes no repo que precisam ser modificados/criados.

3. **PADRÕES DETECTADOS QUE DEVEM SER SEGUIDOS**: Naming conventions, estrutura de pastas, patterns de componentes que o code agent DEVE respeitar.

4. **SUGESTÕES DE MELHORIA ESTRUTURAL**: Se o código atual tem problemas que seriam agravados pela feature.

IMPORTANTE: Não invente nomes de arquivos. Use APENAS caminhos que existem no repositório ou derive novos caminhos seguindo o padrão existente.`

  callbacks.onLog('gemini', `Enviando ${geminiPrompt.length} chars para Gemini (incluindo ${Object.keys(fileContents).length} arquivos de código)...`)

  const resultText = await callGemini(geminiApiKey, geminiPrompt)

  callbacks.onLog('gemini', 'Prompt gerado com sucesso!')
  callbacks.onStep('Concluído')

  const analyzedFiles = [
    ...Object.keys(configContents),
    ...Object.keys(fileContents),
  ]

  return {
    prompt: resultText,
    analyzedFiles,
    detectedPatterns,
    structuralSuggestions: [],
  }
}
