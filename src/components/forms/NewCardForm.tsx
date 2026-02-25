import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { usePromptsStore } from '../../store/prompts'
import { useSettingsStore } from '../../store/settings'
import type { FeatureType } from '../../types'

const FEATURE_TYPES: { value: FeatureType; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'bugfix', label: 'Bugfix' },
  { value: 'refactor', label: 'Refactor' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'hotfix', label: 'Hotfix' },
]

interface NewCardFormProps {
  onClose: () => void
}

export function NewCardForm({ onClose }: NewCardFormProps) {
  const { addCard } = useFeaturesStore()
  const { generalSelects } = usePromptsStore()
  const { branches, selectedRepo, apiKeys, setBranches } = useSettingsStore()

  const [title, setTitle] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Auto-fetch branches when opening the form if repo is selected but branches are empty
  useState(() => {
    if (selectedRepo && apiKeys.githubClientId && branches.length === 0) {
      setLoadingBranches(true)
      fetch(`https://api.github.com/repos/${selectedRepo.full_name}/branches?per_page=100`, {
        headers: { Authorization: `Bearer ${apiKeys.githubClientId}` },
      })
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setBranches(data))
        .finally(() => setLoadingBranches(false))
    }
  })
  const [description, setDescription] = useState('')
  const [featureType, setFeatureType] = useState<FeatureType>('feature')
  const [branch, setBranch] = useState('')
  const [selectedSelects, setSelectedSelects] = useState<string[]>([])
  const [criteria, setCriteria] = useState<string[]>([''])

  function toggleSelect(id: string) {
    setSelectedSelects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function addCriteria() {
    setCriteria([...criteria, ''])
  }

  function removeCriteria(index: number) {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  function updateCriteria(index: number, value: string) {
    const updated = [...criteria]
    updated[index] = value
    setCriteria(updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    addCard({
      columnId: 'input-inicial',
      title: title.trim(),
      description: description.trim(),
      featureType,
      branch,
      attachments: [],
      generalSelects: selectedSelects,
      acceptanceCriteria: criteria.filter((c) => c.trim()),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl mx-4 mb-12">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Nova Feature — Input Inicial</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Implementar sistema de autenticação"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Descrição Detalhada *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva com detalhes o que precisa ser feito, o contexto e quaisquer restrições..."
              rows={5}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tipo de Feature</label>
              <select
                value={featureType}
                onChange={(e) => setFeatureType(e.target.value as FeatureType)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
              >
                {FEATURE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Branch</label>
              {loadingBranches ? (
                <div className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-muted">
                  Carregando branches...
                </div>
              ) : branches.length > 0 ? (
                <>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
                  >
                    <option value="">Selecionar branch...</option>
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  {selectedRepo && (
                    <p className="text-xs text-text-muted mt-1">{selectedRepo.full_name}</p>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main, develop, feature/..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Conecte um repositório GitHub nas configurações para selecionar branches automaticamente.
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">General Selects</label>
            <div className="flex flex-wrap gap-2">
              {generalSelects.map((select) => (
                <button
                  key={select.id}
                  type="button"
                  onClick={() => toggleSelect(select.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedSelects.includes(select.id)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-surface border-border text-text-secondary hover:border-border-strong'
                  }`}
                  title={select.description}
                >
                  {select.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Critérios de Aceite</label>
            <div className="space-y-2">
              {criteria.map((criterion, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={criterion}
                    onChange={(e) => updateCriteria(index, e.target.value)}
                    placeholder={`Critério ${index + 1}...`}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriteria(index)}
                      className="p-2 text-text-muted hover:text-danger rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCriteria}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus size={14} /> Adicionar critério
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Criar Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
