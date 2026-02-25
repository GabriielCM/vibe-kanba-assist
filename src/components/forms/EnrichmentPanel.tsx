import { useState } from 'react'
import { Sparkles, Loader2, FileCode, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { usePromptsStore } from '../../store/prompts'
import { useSettingsStore } from '../../store/settings'
import type { FeatureCard } from '../../types'

interface EnrichmentPanelProps {
  card: FeatureCard
}

export function EnrichmentPanel({ card }: EnrichmentPanelProps) {
  const { addPromptVersion, incrementIteration, setEnrichmentStatus } = useFeaturesStore()
  const { generalRules, generalSelects } = usePromptsStore()
  const { apiKeys } = useSettingsStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasApiKey = !!apiKeys.geminiApiKey
  const isRunning = card.enrichmentStatus === 'running' || loading

  async function generatePrompt() {
    if (!hasApiKey) {
      setError('Configure a API Key do Gemini nas configurações.')
      return
    }

    setLoading(true)
    setError(null)
    setEnrichmentStatus(card.id, 'running')

    try {
      const activeRules = generalRules.filter((r) => r.enabled)
      const activeSelects = generalSelects.filter((s) => card.generalSelects.includes(s.id))

      const systemPrompt = `Você é um engenheiro de prompt especializado em gerar instruções de alta qualidade para code agents.

REGRAS GERAIS (Constituição):
${activeRules.map((r) => `- ${r.title}: ${r.content}`).join('\n') || '(nenhuma regra configurada)'}

MODIFICADORES ATIVOS (General Selects):
${activeSelects.map((s) => `- ${s.name}: ${s.description}`).join('\n') || '(nenhum modificador ativo)'}

TAREFA:
Analise a feature request abaixo e gere um prompt arquiteturalmente alinhado para ser executado por um code agent.

O prompt deve:
1. Ser específico e não ambíguo
2. Incluir critérios de aceite
3. Respeitar padrões existentes
4. Não pedir coisa demais em uma única execução
5. Ser seguro (sem vulnerabilidades)

FEATURE REQUEST:
Título: ${card.title}
Descrição: ${card.description}
Tipo: ${card.featureType}
Branch: ${card.branch}
Critérios de Aceite: ${card.acceptanceCriteria.join(', ') || '(nenhum definido)'}

Retorne em formato estruturado:
1. **PROMPT OTIMIZADO**: O prompt final para o code agent
2. **ARQUIVOS AFETADOS**: Lista de arquivos que provavelmente serão afetados
3. **PADRÕES A SEGUIR**: Padrões que devem ser seguidos
4. **SUGESTÕES DE MELHORIA**: Sugestões de melhoria estrutural (se houver)`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do Gemini'

      addPromptVersion(card.id, {
        content: text,
        analyzedFiles: [],
        detectedPatterns: [],
        structuralSuggestions: [],
      })

      incrementIteration(card.id)
      setEnrichmentStatus(card.id, 'done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao chamar Gemini API'
      setError(msg)
      setEnrichmentStatus(card.id, 'error', msg)
    } finally {
      setLoading(false)
    }
  }

  function retryEnrichment() {
    setEnrichmentStatus(card.id, 'idle')
    generatePrompt()
  }

  const latestPrompt = card.promptVersions[card.promptVersions.length - 1]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-text-primary">Enriquecimento de Contexto</h4>
          <p className="text-xs text-text-muted mt-0.5">
            Gemini analisa o input e gera um prompt de alta qualidade
          </p>
        </div>
        <button
          onClick={latestPrompt ? generatePrompt : retryEnrichment}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : latestPrompt ? <RotateCcw size={16} /> : <Sparkles size={16} />}
          {isRunning ? 'Gerando...' : latestPrompt ? 'Regenerar Prompt' : 'Gerar Prompt'}
        </button>
      </div>

      {/* Status bar */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        card.enrichmentStatus === 'running' ? 'bg-purple-50 border-purple-200' :
        card.enrichmentStatus === 'done' ? 'bg-green-50 border-green-200' :
        card.enrichmentStatus === 'error' ? 'bg-red-50 border-red-200' :
        'bg-surface-secondary border-border'
      }`}>
        {card.enrichmentStatus === 'running' && (
          <>
            <Loader2 size={14} className="animate-spin text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Gemini processando...</span>
            <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden ml-2">
              <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </>
        )}
        {card.enrichmentStatus === 'done' && (
          <>
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Prompt gerado com sucesso ({card.promptVersions.length} versão(ões))
            </span>
          </>
        )}
        {card.enrichmentStatus === 'error' && (
          <>
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-xs font-medium text-red-700 flex-1">{card.enrichmentError || 'Erro no enriquecimento'}</span>
            <button onClick={retryEnrichment} className="text-xs font-medium text-red-600 hover:text-red-700 underline">
              Tentar novamente
            </button>
          </>
        )}
        {card.enrichmentStatus === 'idle' && (
          <>
            <Sparkles size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted">
              {hasApiKey
                ? 'Mova o card para esta coluna para disparar automaticamente, ou clique em "Gerar Prompt".'
                : 'Configure a API Key do Gemini nas configurações.'}
            </span>
          </>
        )}
      </div>

      {!hasApiKey && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">API Key não configurada</p>
            <p className="text-xs mt-0.5">Configure a API Key do Gemini nas configurações para usar o enriquecimento automático.</p>
          </div>
        </div>
      )}

      {error && card.enrichmentStatus !== 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {card.promptVersions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <FileCode size={14} />
            {card.promptVersions.length} versão(ões) gerada(s)
          </div>

          {card.promptVersions.map((pv) => (
            <div key={pv.id} className="border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-surface-secondary rounded-t-lg border-b border-border">
                <span className="text-xs font-medium text-text-primary">
                  Versão {pv.version}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(pv.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-4">
                <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary p-3 rounded-lg max-h-[300px] overflow-y-auto">
                  {pv.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
