import { useEffect, useRef } from 'react'
import { useFeaturesStore } from '../store/features'
import { usePromptsStore } from '../store/prompts'
import { useSettingsStore } from '../store/settings'

/**
 * Auto-triggers Gemini enrichment when a card enters the "enriquecimento" column
 * and hasn't been enriched yet.
 */
export function useAutoEnrichment() {
  const { cards, addPromptVersion, incrementIteration, setEnrichmentStatus } = useFeaturesStore()
  const { generalRules, generalSelects } = usePromptsStore()
  const { apiKeys } = useSettingsStore()
  const processingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const cardsToEnrich = cards.filter(
      (c) =>
        c.columnId === 'enriquecimento' &&
        c.enrichmentStatus === 'idle' &&
        c.promptVersions.length === 0 &&
        !processingRef.current.has(c.id)
    )

    if (!apiKeys.geminiApiKey || cardsToEnrich.length === 0) return

    for (const card of cardsToEnrich) {
      processingRef.current.add(card.id)
      setEnrichmentStatus(card.id, 'running')

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

      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do Gemini'

          addPromptVersion(card.id, {
            content: text,
            analyzedFiles: [],
            detectedPatterns: [],
            structuralSuggestions: [],
          })
          incrementIteration(card.id)
          setEnrichmentStatus(card.id, 'done')
        })
        .catch((err) => {
          setEnrichmentStatus(card.id, 'error', err instanceof Error ? err.message : 'Erro desconhecido')
        })
        .finally(() => {
          processingRef.current.delete(card.id)
        })
    }
  }, [cards, apiKeys.geminiApiKey])
}
