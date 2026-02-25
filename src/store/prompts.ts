import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneralRule, GeneralSelect, PromptTemplate, PromptExample } from '../types'
import { generateId } from '../utils/id'

interface PromptsState {
  generalRules: GeneralRule[]
  generalSelects: GeneralSelect[]
  templates: PromptTemplate[]
  examples: PromptExample[]

  addRule: (rule: Omit<GeneralRule, 'id' | 'createdAt'>) => void
  updateRule: (id: string, updates: Partial<GeneralRule>) => void
  deleteRule: (id: string) => void

  addSelect: (select: Omit<GeneralSelect, 'id'>) => void
  updateSelect: (id: string, updates: Partial<GeneralSelect>) => void
  deleteSelect: (id: string) => void

  addTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt'>) => void
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void
  deleteTemplate: (id: string) => void

  addExample: (example: Omit<PromptExample, 'id' | 'createdAt'>) => void
  deleteExample: (id: string) => void
}

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set) => ({
      generalRules: [],
      generalSelects: [
        { id: 'strict-patterns', name: 'Strict Patterns', description: 'Forçar aderência estrita aos padrões existentes', enabled: true },
        { id: 'minimal-changes', name: 'Minimal Changes', description: 'Minimizar alterações, apenas o necessário', enabled: false },
        { id: 'with-tests', name: 'With Tests', description: 'Incluir testes unitários no output', enabled: false },
        { id: 'dry-principle', name: 'DRY Principle', description: 'Eliminar duplicações agressivamente', enabled: false },
        { id: 'no-new-deps', name: 'No New Dependencies', description: 'Não introduzir novas dependências', enabled: false },
      ],
      templates: [],
      examples: [],

      addRule: (rule) =>
        set((state) => ({
          generalRules: [
            ...state.generalRules,
            { ...rule, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          generalRules: state.generalRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteRule: (id) =>
        set((state) => ({
          generalRules: state.generalRules.filter((r) => r.id !== id),
        })),

      addSelect: (select) =>
        set((state) => ({
          generalSelects: [...state.generalSelects, { ...select, id: generateId() }],
        })),

      updateSelect: (id, updates) =>
        set((state) => ({
          generalSelects: state.generalSelects.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSelect: (id) =>
        set((state) => ({
          generalSelects: state.generalSelects.filter((s) => s.id !== id),
        })),

      addTemplate: (template) =>
        set((state) => ({
          templates: [
            ...state.templates,
            { ...template, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      addExample: (example) =>
        set((state) => ({
          examples: [
            ...state.examples,
            { ...example, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),

      deleteExample: (id) =>
        set((state) => ({
          examples: state.examples.filter((e) => e.id !== id),
        })),
    }),
    { name: 'vibe-kanban-prompts' }
  )
)
