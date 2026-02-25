import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, GitBranch, Tag, IterationCcw, CheckCircle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { COLUMNS } from '../../utils/columns'
import type { FeatureCard, ColumnId, FeatureType } from '../../types'
import { EnrichmentPanel } from './EnrichmentPanel'
import { PromptReviewPanel } from './PromptReviewPanel'
import { ExecutionPanel } from './ExecutionPanel'
import { TechnicalReviewPanel } from './TechnicalReviewPanel'
import { AccuracyPanel } from './AccuracyPanel'

const TYPE_COLORS: Record<FeatureType, string> = {
  feature: 'bg-blue-100 text-blue-700',
  bugfix: 'bg-red-100 text-red-700',
  refactor: 'bg-purple-100 text-purple-700',
  enhancement: 'bg-green-100 text-green-700',
  hotfix: 'bg-orange-100 text-orange-700',
}

interface CardDetailProps {
  card: FeatureCard
  onClose: () => void
}

export function CardDetail({ card, onClose }: CardDetailProps) {
  const { moveCard, deleteCard } = useFeaturesStore()
  const [activeTab, setActiveTab] = useState<string>(card.columnId)

  const currentColIndex = COLUMNS.findIndex((c) => c.id === card.columnId)
  const currentCol = COLUMNS[currentColIndex]

  function advance() {
    if (currentColIndex < COLUMNS.length - 1) {
      const nextCol = COLUMNS[currentColIndex + 1]
      moveCard(card.id, nextCol.id as ColumnId)
    }
  }

  function regress() {
    if (currentColIndex > 0) {
      const prevCol = COLUMNS[currentColIndex - 1]
      moveCard(card.id, prevCol.id as ColumnId)
    }
  }

  function handleDelete() {
    if (confirm('Tem certeza que deseja excluir este card?')) {
      deleteCard(card.id)
      onClose()
    }
  }

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'enriquecimento', label: 'Enriquecimento' },
    { id: 'revisao-prompt', label: 'Revisão' },
    { id: 'execucao', label: 'Execução' },
    { id: 'revisao-tecnica', label: 'Rev. Técnica' },
    { id: 'avaliacao-accuracy', label: 'Accuracy' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-4xl mx-4 mb-12">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentCol?.color }} />
            <div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="text-xs text-text-muted">{currentCol?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={regress}
              disabled={currentColIndex === 0}
              className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary disabled:opacity-30"
              title="Mover para coluna anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={advance}
              disabled={currentColIndex === COLUMNS.length - 1}
              className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary disabled:opacity-30"
              title="Avançar para próxima coluna"
            >
              <ChevronRight size={18} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[card.featureType]}`}>
                  {card.featureType}
                </span>
                {card.branch && (
                  <span className="text-xs text-text-muted flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded-full">
                    <GitBranch size={12} /> {card.branch}
                  </span>
                )}
                {card.promptVersions.length > 0 && (
                  <span className="text-xs text-text-muted flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded-full">
                    <Tag size={12} /> {card.promptVersions.length} versões de prompt
                  </span>
                )}
                <span className="text-xs text-text-muted flex items-center gap-1 bg-surface-secondary px-2 py-1 rounded-full">
                  <IterationCcw size={12} /> {card.iterationCount} iterações
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">Descrição</h4>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{card.description}</p>
              </div>

              {card.acceptanceCriteria.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">Critérios de Aceite</h4>
                  <ul className="space-y-1">
                    {card.acceptanceCriteria.map((criterion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle size={14} className="mt-0.5 text-text-muted" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {card.generalSelects.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">General Selects Ativados</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {card.generalSelects.map((selectId) => (
                      <span
                        key={selectId}
                        className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 font-medium"
                      >
                        {selectId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-medium text-danger border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Excluir Card
                </button>
                <span className="text-xs text-text-muted ml-auto">
                  Criado em {new Date(card.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'enriquecimento' && <EnrichmentPanel card={card} />}
          {activeTab === 'revisao-prompt' && <PromptReviewPanel card={card} />}
          {activeTab === 'execucao' && <ExecutionPanel card={card} />}
          {activeTab === 'revisao-tecnica' && <TechnicalReviewPanel card={card} />}
          {activeTab === 'avaliacao-accuracy' && <AccuracyPanel card={card} />}
        </div>
      </div>
    </div>
  )
}
