import { useState } from 'react'
import { Star, Save, AlertTriangle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { useImprovementsStore } from '../../store/improvements'
import type { FeatureCard } from '../../types'

interface AccuracyPanelProps {
  card: FeatureCard
}

const ACCURACY_QUESTIONS = [
  { key: 'specificEnough' as const, label: 'O prompt foi suficientemente específico?' },
  { key: 'missingContext' as const, label: 'Faltou contexto?', inverted: true },
  { key: 'missingRestrictions' as const, label: 'Faltaram restrições?', inverted: true },
  { key: 'missingAcceptanceCriteria' as const, label: 'Faltaram critérios de aceite?', inverted: true },
  { key: 'agentHadToGuess' as const, label: 'O agent teve que "adivinhar" coisas?', inverted: true },
]

export function AccuracyPanel({ card }: AccuracyPanelProps) {
  const { setPromptAccuracy } = useFeaturesStore()
  const { addCard: addImprovement } = useImprovementsStore()

  const existing = card.promptAccuracy
  const [accuracy, setAccuracy] = useState({
    score: existing?.score ?? 3,
    specificEnough: existing?.specificEnough ?? true,
    missingContext: existing?.missingContext ?? false,
    missingRestrictions: existing?.missingRestrictions ?? false,
    missingAcceptanceCriteria: existing?.missingAcceptanceCriteria ?? false,
    agentHadToGuess: existing?.agentHadToGuess ?? false,
    notes: existing?.notes ?? '',
  })

  function save() {
    setPromptAccuracy(card.id, {
      ...accuracy,
      evaluatedAt: new Date().toISOString(),
    })

    if (accuracy.score <= 2) {
      addImprovement({
        title: `Refinar template: ${card.title}`,
        description: `Score ${accuracy.score}/5. Notas: ${accuracy.notes}`,
        type: 'template-adjustment',
        status: 'backlog',
      })
    }
  }

  function toggleField(key: keyof typeof accuracy) {
    setAccuracy((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-text-primary">Avaliação de Accuracy do Prompt</h4>
        <p className="text-xs text-text-muted mt-0.5">
          Avalie o PROMPT, não o código. Score baixo cria card automático em Melhoria do Sistema.
        </p>
      </div>

      {/* Score */}
      <div className="border border-border rounded-lg p-4">
        <h5 className="text-sm font-medium text-text-primary mb-3">Score do Prompt</h5>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => setAccuracy((prev) => ({ ...prev, score }))}
              className={`p-2 rounded-lg transition-colors ${
                accuracy.score >= score
                  ? 'text-yellow-500'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star size={28} fill={accuracy.score >= score ? 'currentColor' : 'none'} />
            </button>
          ))}
          <span className="ml-2 text-lg font-bold text-text-primary">{accuracy.score}/5</span>
        </div>
        {accuracy.score <= 2 && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
            <AlertTriangle size={14} className="text-yellow-600" />
            <p className="text-xs text-yellow-700">
              Score baixo: será criado card em "Melhoria do Sistema" ao salvar.
            </p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        {ACCURACY_QUESTIONS.map((q) => {
          const value = accuracy[q.key] as boolean
          return (
            <label
              key={q.key}
              className="flex items-center justify-between py-1.5 cursor-pointer"
            >
              <span className="text-sm text-text-secondary">{q.label}</span>
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleField(q.key)}
                className="w-4 h-4 rounded border-border-strong text-primary-600 focus:ring-primary-500"
              />
            </label>
          )
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Notas</label>
        <textarea
          value={accuracy.notes}
          onChange={(e) => setAccuracy((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre a qualidade do prompt, o que poderia ser melhorado..."
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
        />
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        <Save size={14} /> Salvar Avaliação
      </button>

      {/* Metric */}
      <div className="border border-border rounded-lg p-4 bg-surface-secondary">
        <h5 className="text-sm font-medium text-text-primary mb-1">Métrica Principal</h5>
        <p className="text-xs text-text-muted mb-2">Iterações de prompt até aprovação</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-text-primary">{card.iterationCount}</span>
          <span className="text-sm text-text-muted">iterações</span>
          {card.iterationCount <= 2 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Bom</span>
          ) : card.iterationCount <= 4 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Atenção</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Especificação fraca</span>
          )}
        </div>
      </div>

      {existing?.evaluatedAt && (
        <p className="text-xs text-text-muted">
          Última avaliação: {new Date(existing.evaluatedAt).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  )
}
