import { useState } from 'react'
import { Edit3, Check, AlertTriangle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import type { FeatureCard } from '../../types'

interface PromptReviewPanelProps {
  card: FeatureCard
}

const REVIEW_CHECKLIST = [
  { id: 'clear', label: 'Está claro?' },
  { id: 'specific', label: 'Está específico?' },
  { id: 'aligned', label: 'Está alinhado com arquitetura?' },
  { id: 'scoped', label: 'Está pedindo coisa demais?' },
  { id: 'scope-respected', label: 'Está respeitando escopo?' },
  { id: 'acceptance', label: 'Inclui critérios de aceite?' },
  { id: 'secure', label: 'Está seguro?' },
]

export function PromptReviewPanel({ card }: PromptReviewPanelProps) {
  const { addPromptVersion, incrementIteration } = useFeaturesStore()

  const latestPrompt = card.promptVersions[card.promptVersions.length - 1]
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(latestPrompt?.content || '')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  function toggleCheck(id: string) {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function saveEdit() {
    if (!editedContent.trim()) return
    addPromptVersion(card.id, {
      content: editedContent.trim(),
      analyzedFiles: latestPrompt?.analyzedFiles || [],
      detectedPatterns: latestPrompt?.detectedPatterns || [],
      structuralSuggestions: latestPrompt?.structuralSuggestions || [],
    })
    incrementIteration(card.id)
    setEditing(false)
  }

  if (!latestPrompt) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm">Nenhum prompt gerado ainda.</p>
        <p className="text-xs mt-1">Gere um prompt na aba de Enriquecimento primeiro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-text-primary">Revisão Humana do Prompt</h4>
          <p className="text-xs text-text-muted mt-0.5">Revise, edite e valide o prompt antes da execução</p>
        </div>
        <button
          onClick={() => {
            setEditing(!editing)
            setEditedContent(latestPrompt.content)
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-surface-hover"
        >
          <Edit3 size={14} />
          {editing ? 'Cancelar' : 'Editar Prompt'}
        </button>
      </div>

      {/* Checklist */}
      <div className="border border-border rounded-lg p-4">
        <h5 className="text-sm font-medium text-text-primary mb-3">Checklist de Revisão</h5>
        <div className="grid grid-cols-2 gap-2">
          {REVIEW_CHECKLIST.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary"
            >
              <input
                type="checkbox"
                checked={checklist[item.id] || false}
                onChange={() => toggleCheck(item.id)}
                className="w-4 h-4 rounded border-border-strong text-primary-600 focus:ring-primary-500"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {/* Prompt Content */}
      <div className="border border-border rounded-lg">
        <div className="flex items-center justify-between px-4 py-2 bg-surface-secondary rounded-t-lg border-b border-border">
          <span className="text-xs font-medium">Prompt v{latestPrompt.version}</span>
          {editing && (
            <button
              onClick={saveEdit}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Check size={12} /> Salvar como nova versão
            </button>
          )}
        </div>
        <div className="p-4">
          {editing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 p-3 text-sm font-mono border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
          ) : (
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary p-3 rounded-lg max-h-[300px] overflow-y-auto">
              {latestPrompt.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
