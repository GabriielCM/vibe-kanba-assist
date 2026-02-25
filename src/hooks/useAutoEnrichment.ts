import { useEffect, useRef } from 'react'
import { useFeaturesStore } from '../store/features'
import { usePromptsStore } from '../store/prompts'
import { useSettingsStore } from '../store/settings'
import { runEnrichmentPipeline } from '../utils/enrichment'

/**
 * Auto-triggers real Gemini enrichment (with GitHub repo analysis) when a card
 * enters the "enriquecimento" column and hasn't been enriched yet.
 */
export function useAutoEnrichment() {
  const { cards, addPromptVersion, incrementIteration, setEnrichmentStatus, addEnrichmentLog, clearEnrichmentLogs } = useFeaturesStore()
  const { generalRules, generalSelects } = usePromptsStore()
  const { apiKeys, selectedRepo } = useSettingsStore()
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
      clearEnrichmentLogs(card.id)
      setEnrichmentStatus(card.id, 'running')

      const hasGitHub = !!apiKeys.githubClientId && !!selectedRepo

      if (hasGitHub) {
        addEnrichmentLog(card.id, 'start', `Iniciando enriquecimento com análise do repo ${selectedRepo!.full_name}...`)

        runEnrichmentPipeline(
          card,
          selectedRepo!.full_name,
          apiKeys.githubClientId,
          apiKeys.geminiApiKey,
          generalRules,
          generalSelects,
          {
            onLog: (step, detail) => addEnrichmentLog(card.id, step, detail),
            onStep: (step) => addEnrichmentLog(card.id, 'step', step),
          },
        )
          .then((result) => {
            addPromptVersion(card.id, {
              content: result.prompt,
              analyzedFiles: result.analyzedFiles,
              detectedPatterns: result.detectedPatterns,
              structuralSuggestions: result.structuralSuggestions,
            })
            incrementIteration(card.id)
            setEnrichmentStatus(card.id, 'done')
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido'
            addEnrichmentLog(card.id, 'error', msg)
            setEnrichmentStatus(card.id, 'error', msg)
          })
          .finally(() => {
            processingRef.current.delete(card.id)
          })
      } else {
        addEnrichmentLog(card.id, 'warn', 'Nenhum repositório GitHub conectado. Gerando prompt sem análise de código.')
        addEnrichmentLog(card.id, 'step', 'Gerando prompt com Gemini (sem contexto de repo)...')

        const activeRules = generalRules.filter((r) => r.enabled)
        const activeSelects = generalSelects.filter((s) => card.generalSelects.includes(s.id))

        const systemPrompt = `Você é um engenheiro de prompt especializado em gerar instruções de alta qualidade para code agents.

REGRAS GERAIS:
${activeRules.map((r) => `- ${r.title}: ${r.content}`).join('\n') || '(nenhuma)'}

MODIFICADORES ATIVOS:
${activeSelects.map((s) => `- ${s.name}: ${s.description}`).join('\n') || '(nenhum)'}

Gere um prompt para code agent:
Título: ${card.title}
Descrição: ${card.description}
Tipo: ${card.featureType}
Branch: ${card.branch}
Critérios: ${card.acceptanceCriteria.join(', ') || '(nenhum)'}

ATENÇÃO: Sem acesso ao código do repositório. Gere o melhor prompt possível.`

        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
          }
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
            return res.json()
          })
          .then((data: { candidates?: { content?: { parts?: { text?: string }[] } }[] }) => {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'
            addPromptVersion(card.id, { content: text, analyzedFiles: [], detectedPatterns: [], structuralSuggestions: [] })
            incrementIteration(card.id)
            addEnrichmentLog(card.id, 'done', 'Prompt gerado (sem contexto de repo).')
            setEnrichmentStatus(card.id, 'done')
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido'
            addEnrichmentLog(card.id, 'error', msg)
            setEnrichmentStatus(card.id, 'error', msg)
          })
          .finally(() => {
            processingRef.current.delete(card.id)
          })
      }
    }
  }, [cards, apiKeys.geminiApiKey])
}
