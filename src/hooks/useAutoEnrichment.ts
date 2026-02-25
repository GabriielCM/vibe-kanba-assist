import { useEffect, useRef, useCallback } from 'react'
import { useFeaturesStore } from '../store/features'
import { usePromptsStore } from '../store/prompts'
import { useSettingsStore } from '../store/settings'
import { runEnrichmentPipeline } from '../utils/enrichment'
import type { EnrichmentLogEntry } from '../types'

/**
 * Auto-triggers real Gemini enrichment (with GitHub repo analysis) when a card
 * enters the "enriquecimento" column and hasn't been enriched yet.
 *
 * Key design decisions:
 * - Uses getState() for all async store access to avoid stale closures
 * - Batches log entries (flush every 150ms) to reduce re-renders
 * - Separates onStep (enrichmentStep field) from onLog (enrichmentLogs array)
 * - processingRef prevents double-processing; cleaned up in finally block
 */
export function useAutoEnrichment() {
  const cards = useFeaturesStore((s) => s.cards)
  const geminiApiKey = useSettingsStore((s) => s.apiKeys.geminiApiKey)
  const processingRef = useRef<Set<string>>(new Set())

  const processCard = useCallback(async (cardId: string) => {
    // === Read fresh state via getState() ===
    const featuresState = useFeaturesStore.getState()
    const { apiKeys, selectedRepo } = useSettingsStore.getState()
    const { generalRules, generalSelects } = usePromptsStore.getState()

    const card = featuresState.cards.find((c) => c.id === cardId)
    if (!card) {
      processingRef.current.delete(cardId)
      return
    }

    featuresState.clearEnrichmentLogs(cardId)
    featuresState.setEnrichmentStatus(cardId, 'running')

    const hasGitHub = !!apiKeys.githubClientId && !!selectedRepo

    // === Log batching ===
    let logBuffer: EnrichmentLogEntry[] = []
    let flushTimer: ReturnType<typeof setInterval> | null = null

    function flushLogs() {
      if (logBuffer.length > 0) {
        const batch = [...logBuffer]
        logBuffer = []
        useFeaturesStore.getState().addEnrichmentLogs(cardId, batch)
      }
    }

    function startFlushing() {
      flushTimer = setInterval(flushLogs, 150)
    }

    function stopFlushing() {
      if (flushTimer) {
        clearInterval(flushTimer)
        flushTimer = null
      }
      flushLogs()
    }

    function bufferLog(step: string, detail: string) {
      logBuffer.push({
        timestamp: new Date().toISOString(),
        step,
        detail,
      })
    }

    startFlushing()

    try {
      if (hasGitHub) {
        bufferLog('start', `Iniciando enriquecimento com análise do repo ${selectedRepo!.full_name}...`)

        const result = await runEnrichmentPipeline(
          card,
          selectedRepo!.full_name,
          apiKeys.githubClientId,
          apiKeys.geminiApiKey,
          generalRules,
          generalSelects,
          {
            onLog: (step, detail) => bufferLog(step, detail),
            onStep: (stepDescription) => {
              flushLogs()
              useFeaturesStore.getState().setEnrichmentStep(cardId, stepDescription)
            },
          },
        )

        stopFlushing()

        useFeaturesStore.getState().addPromptVersion(cardId, {
          content: result.prompt,
          analyzedFiles: result.analyzedFiles,
          detectedPatterns: result.detectedPatterns,
          structuralSuggestions: result.structuralSuggestions,
        })
        useFeaturesStore.getState().incrementIteration(cardId)
        useFeaturesStore.getState().setEnrichmentStatus(cardId, 'done')
      } else {
        // === Fallback: Gemini without GitHub context ===
        bufferLog('warn', 'Nenhum repositório GitHub conectado. Gerando prompt sem análise de código.')
        useFeaturesStore.getState().setEnrichmentStep(cardId, 'Gerando prompt com Gemini (sem contexto de repo)...')

        const activeRules = generalRules.filter((r) => r.enabled)
        const activeSelects = generalSelects.filter((s) => (card.generalSelects || []).includes(s.id))

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
Critérios: ${(card.acceptanceCriteria || []).join(', ') || '(nenhum)'}

ATENÇÃO: Sem acesso ao código do repositório. Gere o melhor prompt possível.`

        bufferLog('gemini', `Enviando ${systemPrompt.length} chars para Gemini...`)
        flushLogs()

        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKeys.geminiApiKey,
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
          }
        )

        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
        const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'

        stopFlushing()

        useFeaturesStore.getState().addPromptVersion(cardId, {
          content: text,
          analyzedFiles: [],
          detectedPatterns: [],
          structuralSuggestions: [],
        })
        useFeaturesStore.getState().incrementIteration(cardId)
        useFeaturesStore.getState().addEnrichmentLogs(cardId, [
          { timestamp: new Date().toISOString(), step: 'done', detail: 'Prompt gerado (sem contexto de repo).' }
        ])
        useFeaturesStore.getState().setEnrichmentStatus(cardId, 'done')
      }
    } catch (err) {
      stopFlushing()
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      useFeaturesStore.getState().addEnrichmentLogs(cardId, [
        { timestamp: new Date().toISOString(), step: 'error', detail: msg }
      ])
      useFeaturesStore.getState().setEnrichmentStatus(cardId, 'error', msg)
    } finally {
      // CRITICAL: Always clean up so the card can be re-processed after "Regenerar"
      processingRef.current.delete(cardId)
    }
  }, [])

  useEffect(() => {
    const cardsToEnrich = cards.filter(
      (c) =>
        c.columnId === 'enriquecimento' &&
        (!c.enrichmentStatus || c.enrichmentStatus === 'idle') &&
        !processingRef.current.has(c.id)
    )

    if (!geminiApiKey || cardsToEnrich.length === 0) return

    for (const card of cardsToEnrich) {
      processingRef.current.add(card.id)
      processCard(card.id)
    }
  }, [cards, geminiApiKey, processCard])
}
