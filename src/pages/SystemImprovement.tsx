import { useState } from 'react'
import { Plus, Trash2, ArrowRight, CheckCircle } from 'lucide-react'
import { useImprovementsStore } from '../store/improvements'
import type { ImprovementType, ImprovementStatus } from '../types'

const TYPE_LABELS: Record<ImprovementType, string> = {
  'template-adjustment': 'Ajustar Template',
  'new-select': 'Novo Select',
  'search-heuristic': 'Heurística de Busca',
  'evaluation-criteria': 'Critérios de Avaliação',
}

const TYPE_COLORS: Record<ImprovementType, string> = {
  'template-adjustment': 'bg-purple-100 text-purple-700',
  'new-select': 'bg-blue-100 text-blue-700',
  'search-heuristic': 'bg-orange-100 text-orange-700',
  'evaluation-criteria': 'bg-green-100 text-green-700',
}

const STATUS_COLS: { id: ImprovementStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#94a3b8' },
  { id: 'in-progress', title: 'Em Progresso', color: '#f59e0b' },
  { id: 'done', title: 'Concluído', color: '#22c55e' },
]

export function SystemImprovement() {
  const { cards, addCard, updateStatus, deleteCard } = useImprovementsStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ImprovementType>('template-adjustment')

  function handleAdd() {
    if (!title.trim()) return
    addCard({ title, description, type, status: 'backlog' })
    setTitle('')
    setDescription('')
    setShowForm(false)
  }

  function advance(id: string, currentStatus: ImprovementStatus) {
    const next: Record<ImprovementStatus, ImprovementStatus> = {
      'backlog': 'in-progress',
      'in-progress': 'done',
      'done': 'done',
    }
    updateStatus(id, next[currentStatus])
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Board 3 — Melhoria do Sistema</h3>
          <p className="text-sm text-text-muted">Ajustar templates, criar selects, melhorar heurísticas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Nova Melhoria
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da melhoria"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ImprovementType)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Criar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {STATUS_COLS.map((col) => {
          const colCards = cards.filter((c) => c.status === col.id)
          return (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                <h4 className="text-sm font-semibold">{col.title}</h4>
                <span className="text-xs text-text-muted bg-surface-hover rounded-full px-2 py-0.5">
                  {colCards.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[200px] bg-surface-secondary rounded-lg p-2">
                {colCards.map((card) => (
                  <div key={card.id} className="bg-surface border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-sm font-medium">{card.title}</h5>
                      <button onClick={() => deleteCard(card.id)} className="p-0.5 text-text-muted hover:text-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {card.description && (
                      <p className="text-xs text-text-muted mb-2 line-clamp-2">{card.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[card.type]}`}>
                        {TYPE_LABELS[card.type]}
                      </span>
                      {card.status !== 'done' && (
                        <button
                          onClick={() => advance(card.id, card.status)}
                          className="p-1 text-text-muted hover:text-primary-600"
                          title="Avançar"
                        >
                          {card.status === 'in-progress' ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-8">Vazio</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
