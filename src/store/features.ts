import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FeatureCard, ColumnId, PromptVersion, CodeOutput, TechnicalReview, PromptAccuracy, EnrichmentStatus } from '../types'
import { generateId } from '../utils/id'

interface FeaturesState {
  cards: FeatureCard[]
  addCard: (card: Omit<FeatureCard, 'id' | 'createdAt' | 'updatedAt' | 'promptVersions' | 'codeOutputs' | 'technicalReview' | 'promptAccuracy' | 'iterationCount' | 'enrichmentStatus' | 'enrichmentError' | 'enrichmentLogs' | 'enrichmentStep'>) => string
  updateCard: (id: string, updates: Partial<FeatureCard>) => void
  moveCard: (id: string, toColumn: ColumnId) => void
  deleteCard: (id: string) => void
  addPromptVersion: (cardId: string, prompt: Omit<PromptVersion, 'id' | 'version' | 'createdAt'>) => void
  addCodeOutput: (cardId: string, output: Omit<CodeOutput, 'id' | 'version' | 'createdAt'>) => void
  setTechnicalReview: (cardId: string, review: TechnicalReview) => void
  setPromptAccuracy: (cardId: string, accuracy: PromptAccuracy) => void
  incrementIteration: (cardId: string) => void
  setEnrichmentStatus: (cardId: string, status: EnrichmentStatus, error?: string | null) => void
  addEnrichmentLog: (cardId: string, step: string, detail: string) => void
  setEnrichmentStep: (cardId: string, step: string) => void
  clearEnrichmentLogs: (cardId: string) => void
  getCardsByColumn: (columnId: ColumnId) => FeatureCard[]
}

export const useFeaturesStore = create<FeaturesState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        const id = generateId()
        const now = new Date().toISOString()
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id,
              promptVersions: [],
              codeOutputs: [],
              technicalReview: null,
              promptAccuracy: null,
              enrichmentStatus: 'idle',
              enrichmentError: null,
              enrichmentLogs: [],
              enrichmentStep: '',
              iterationCount: 0,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }))
        return id
      },

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, ...updates, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      moveCard: (id, toColumn) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, columnId: toColumn, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      deleteCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),

      addPromptVersion: (cardId, prompt) =>
        set((state) => ({
          cards: state.cards.map((card) => {
            if (card.id !== cardId) return card
            const version = card.promptVersions.length + 1
            return {
              ...card,
              promptVersions: [
                ...card.promptVersions,
                {
                  ...prompt,
                  id: generateId(),
                  version,
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      addCodeOutput: (cardId, output) =>
        set((state) => ({
          cards: state.cards.map((card) => {
            if (card.id !== cardId) return card
            const version = card.codeOutputs.length + 1
            return {
              ...card,
              codeOutputs: [
                ...card.codeOutputs,
                {
                  ...output,
                  id: generateId(),
                  version,
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      setTechnicalReview: (cardId, review) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? { ...card, technicalReview: review, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      setPromptAccuracy: (cardId, accuracy) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? { ...card, promptAccuracy: accuracy, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      incrementIteration: (cardId) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? { ...card, iterationCount: card.iterationCount + 1, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      setEnrichmentStatus: (cardId, status, error = null) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? { ...card, enrichmentStatus: status, enrichmentError: error ?? null, updatedAt: new Date().toISOString() }
              : card
          ),
        })),

      addEnrichmentLog: (cardId, step, detail) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  enrichmentLogs: [...(card.enrichmentLogs || []), { timestamp: new Date().toISOString(), step, detail }],
                  enrichmentStep: step,
                }
              : card
          ),
        })),

      setEnrichmentStep: (cardId, step) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId ? { ...card, enrichmentStep: step } : card
          ),
        })),

      clearEnrichmentLogs: (cardId) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === cardId ? { ...card, enrichmentLogs: [], enrichmentStep: '', enrichmentStatus: card.enrichmentStatus ?? 'idle', enrichmentError: card.enrichmentError ?? null } : card
          ),
        })),

      getCardsByColumn: (columnId) => get().cards.filter((card) => card.columnId === columnId),
    }),
    {
      name: 'vibe-kanban-features',
      // Migrate old cards that lack newer fields (enrichmentLogs, enrichmentStatus, etc.)
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<FeaturesState> | undefined
        if (!persistedState || !persistedState.cards) return current
        return {
          ...current,
          ...persistedState,
          cards: persistedState.cards.map((card) => ({
            ...card,
            enrichmentStatus: card.enrichmentStatus ?? 'idle',
            enrichmentError: card.enrichmentError ?? null,
            enrichmentLogs: card.enrichmentLogs ?? [],
            enrichmentStep: card.enrichmentStep ?? '',
            iterationCount: card.iterationCount ?? 0,
            promptVersions: card.promptVersions ?? [],
            codeOutputs: card.codeOutputs ?? [],
            technicalReview: card.technicalReview ?? null,
            promptAccuracy: card.promptAccuracy ?? null,
            generalSelects: card.generalSelects ?? [],
          })),
        }
      },
    }
  )
)
