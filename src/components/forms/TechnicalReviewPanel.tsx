import { useState } from 'react'
import { CheckCircle, XCircle, Save } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import type { FeatureCard } from '../../types'

interface TechnicalReviewPanelProps {
  card: FeatureCard
}

const CHECKLIST_ITEMS = [
  { key: 'followedPatterns' as const, label: 'Seguiu padrões existentes?', positive: true },
  { key: 'brokeConvention' as const, label: 'Quebrou convenção?', positive: false },
  { key: 'technicalDebt' as const, label: 'Introduziu débito técnico?', positive: false },
  { key: 'createdDuplication' as const, label: 'Criou duplicação?', positive: false },
  { key: 'unexpectedFiles' as const, label: 'Alterou arquivos não previstos?', positive: false },
]

export function TechnicalReviewPanel({ card }: TechnicalReviewPanelProps) {
  const { setTechnicalReview } = useFeaturesStore()

  const existing = card.technicalReview
  const [review, setReview] = useState({
    followedPatterns: existing?.followedPatterns ?? false,
    brokeConvention: existing?.brokeConvention ?? false,
    technicalDebt: existing?.technicalDebt ?? false,
    createdDuplication: existing?.createdDuplication ?? false,
    unexpectedFiles: existing?.unexpectedFiles ?? false,
    notes: existing?.notes ?? '',
  })

  function save() {
    setTechnicalReview(card.id, {
      ...review,
      reviewedAt: new Date().toISOString(),
    })
  }

  function toggleField(key: keyof typeof review) {
    setReview((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-text-primary">Revisão Técnica</h4>
        <p className="text-xs text-text-muted mt-0.5">
          Inspecione o código produzido. Se houver erro estrutural, o problema pode ser do prompt.
        </p>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const value = review[item.key] as boolean
          const isGood = item.positive ? value : !value
          return (
            <label
              key={item.key}
              className="flex items-center justify-between py-2 border-b border-border last:border-b-0 cursor-pointer"
            >
              <span className="text-sm text-text-secondary">{item.label}</span>
              <button
                type="button"
                onClick={() => toggleField(item.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isGood
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {value ? (
                  <>
                    <CheckCircle size={12} /> Sim
                  </>
                ) : (
                  <>
                    <XCircle size={12} /> Não
                  </>
                )}
              </button>
            </label>
          )
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Notas da Revisão</label>
        <textarea
          value={review.notes}
          onChange={(e) => setReview((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre a qualidade do código, problemas encontrados..."
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
        />
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
      >
        <Save size={14} /> Salvar Revisão
      </button>

      {existing?.reviewedAt && (
        <p className="text-xs text-text-muted">
          Última revisão: {new Date(existing.reviewedAt).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  )
}
