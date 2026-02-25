import { useState } from 'react'
import { Sparkles, Loader2, FileCode, AlertCircle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { usePromptsStore } from '../../store/prompts'
import { useSettingsStore } from '../../store/settings'
import type { FeatureCard } from '../../types'

interface EnrichmentPanelProps {
  card: FeatureCard
}

export function EnrichmentPanel({ card }: EnrichmentPanelProps) {
  const { addPromptVersion, incrementIteration } = useFeaturesStore()
  const { generalRules, generalSelects } = usePromptsStore()
  const { apiKeys } = useSettingsStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasApiKey = !!apiKeys.geminiApiKey

  async function generatePrompt() {
    if (!hasApiKey) {
      setError('Configure a API Key do Gemini nas configurações.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const activeRules = generalRules.filter((r) => r.enabled)
      const activeSelects = generalSelects.filter((s) => card.generalSelects.includes(s.id))

      const systemPrompt = `Você é um engenheiro de prompt especializado em gerar instruções de alta qualidade para code agents.

REGRAS GERAIS (Constituição):
${activeRules.map((r) => `- ${r.title}: ${r.content}`).join('\n')}

MODIFICADORES ATIVOS (General Selects):
${activeSelects.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

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
Critérios de Aceite: ${card.acceptanceCriteria.join(', ')}

Retorne:
1. O prompt otimizado
2. Lista de arquivos que provavelmente serão afetados
3. Padrões que devem ser seguidos
4. Sugestões de melhoria estrutural (se houver)`

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao chamar Gemini API')
    } finally {
      setLoading(false)
    }
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
          onClick={generatePrompt}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Gerando...' : latestPrompt ? 'Regenerar Prompt' : 'Gerar Prompt'}
        </button>
      </div>

      {!hasApiKey && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">API Key não configurada</p>
            <p className="text-xs mt-0.5">Configure a API Key do Gemini nas configurações para usar o enriquecimento.</p>
          </div>
        </div>
      )}

      {error && (
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
