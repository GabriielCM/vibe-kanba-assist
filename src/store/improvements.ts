import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ImprovementCard, ImprovementStatus, ImprovementType } from '../types'
import { generateId } from '../utils/id'

interface ImprovementsState {
  cards: ImprovementCard[]
  addCard: (card: Omit<ImprovementCard, 'id' | 'createdAt' | 'completedAt'>) => void
  updateStatus: (id: string, status: ImprovementStatus) => void
  deleteCard: (id: string) => void
  getByStatus: (status: ImprovementStatus) => ImprovementCard[]
  getByType: (type: ImprovementType) => ImprovementCard[]
}

export const useImprovementsStore = create<ImprovementsState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id: generateId(),
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
          ],
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? {
                  ...card,
                  status,
                  completedAt: status === 'done' ? new Date().toISOString() : card.completedAt,
                }
              : card
          ),
        })),

      deleteCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),

      getByStatus: (status) => get().cards.filter((card) => card.status === status),
      getByType: (type) => get().cards.filter((card) => card.type === type),
    }),
    { name: 'vibe-kanban-improvements' }
  )
)
