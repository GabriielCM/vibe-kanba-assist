import { useEffect, useRef } from 'react'
import { useFeaturesStore } from '../store/features'
import { usePromptsStore } from '../store/prompts'
import { useSettingsStore } from '../store/settings'
import { runEnrichmentPipeline } from '../utils/enrichment'
import type { EnrichmentLogEntry } from '../types'

/**
 * Auto-triggers real Gemini enrichment (with GitHub repo analysis) when a card
 * enters the "enriquecimento" column and hasn't been enriched yet.
 *
 * Uses getState() to avoid stale closures in async callbacks.
 * Batches log entries to avoid excessive Zustand state updates.
 */
export function useAutoEnrichment() {
  const cards = useFeaturesStore((s) => s.cards)
  const geminiApiKey = useSettingsStore((s) => s.apiKeys.geminiApiKey)
  const processingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const cardsToEnrich = cards.filter(
      (c) =>
        c.columnId === 'enriquecimento' &&
        (!c.enrichmentStatus || c.enrichmentStatus === 'idle') &&
        (!c.promptVersions || c.promptVersions.length === 0) &&
        !processingRef.current.has(c.id)
    )

    if (!geminiApiKey || cardsToEnrich.length === 0) return

    for (const card of cardsToEnrich) {
      processingRef.current.add(card.id)
      runEnrichmentForCard(card.id)
    }
  }, [cards, geminiApiKey])
}

/**
 * Run the enrichment pipeline for a single card.
 * All store access is via getState() to avoid stale closures.
 */
async function runEnrichmentForCard(cardId: string) {
  // Read fresh state
  const { clearEnrichmentLogs, setEnrichmentStatus, setEnrichmentStep, addEnrichmentLogs, addPromptVersion, incrementIteration } = useFeaturesStore.getState()
  const { apiKeys, selectedRepo } = useSettingsStore.getState()
  const { generalRules, generalSelects } = usePromptsStore.getState()

  const card = useFeaturesStore.getState().cards.find((c) => c.id === cardId)
  if (!card) return

  clearEnrichmentLogs(cardId)
  setEnrichmentStatus(cardId, 'running')

  const hasGitHub = !!apiKeys.githubClientId && !!selectedRepo

  // === Log batching mechanism ===
  // Accumulate logs and flush to store every 150ms to reduce re-renders
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
    flushLogs() // flush remaining
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
            // Flush logs immediately when step changes so UI updates
            flushLogs()
            useFeaturesStore.getState().setEnrichmentStep(cardId, stepDescription)
          },
        },
      )

      stopFlushing()

      // Use getState() for all post-completion updates
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
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

      useFeaturesStore.getState().addPromptVersion(cardId, { content: text, analyzedFiles: [], detectedPatterns: [], structuralSuggestions: [] })
      useFeaturesStore.getState().incrementIteration(cardId)
      bufferLog('done', 'Prompt gerado (sem contexto de repo).')
      flushLogs()
      useFeaturesStore.getState().setEnrichmentStatus(cardId, 'done')
    }
  } catch (err) {
    stopFlushing()
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    useFeaturesStore.getState().addEnrichmentLogs(cardId, [{ timestamp: new Date().toISOString(), step: 'error', detail: msg }])
    useFeaturesStore.getState().setEnrichmentStatus(cardId, 'error', msg)
  }
}
