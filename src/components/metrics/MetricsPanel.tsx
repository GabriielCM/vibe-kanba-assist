import { useMemo } from 'react'
import { BarChart3, TrendingUp, Target, IterationCcw } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'

export function MetricsPanel() {
  const { cards } = useFeaturesStore()

  const metrics = useMemo(() => {
    const evaluated = cards.filter((c) => c.promptAccuracy)
    const totalIterations = cards.reduce((sum, c) => sum + c.iterationCount, 0)
    const avgIterations = cards.length > 0 ? totalIterations / cards.length : 0
    const avgScore = evaluated.length > 0
      ? evaluated.reduce((sum, c) => sum + (c.promptAccuracy?.score || 0), 0) / evaluated.length
      : 0

    const iterationDistribution = {
      good: cards.filter((c) => c.iterationCount <= 2).length,
      warning: cards.filter((c) => c.iterationCount > 2 && c.iterationCount <= 4).length,
      bad: cards.filter((c) => c.iterationCount > 4).length,
    }

    const byColumn: Record<string, number> = {}
    cards.forEach((c) => {
      byColumn[c.columnId] = (byColumn[c.columnId] || 0) + 1
    })

    return {
      total: cards.length,
      evaluated: evaluated.length,
      totalIterations,
      avgIterations: avgIterations.toFixed(1),
      avgScore: avgScore.toFixed(1),
      iterationDistribution,
      byColumn,
    }
  }, [cards])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Métricas do Sistema</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Métrica principal: iterações de prompt até aprovação
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-text-muted">
            <Target size={16} />
            <span className="text-xs font-medium">Total Features</span>
          </div>
          <p className="text-2xl font-bold">{metrics.total}</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-text-muted">
            <IterationCcw size={16} />
            <span className="text-xs font-medium">Média de Iterações</span>
          </div>
          <p className="text-2xl font-bold">{metrics.avgIterations}</p>
          <p className="text-xs text-text-muted mt-1">
            {Number(metrics.avgIterations) <= 2 ? 'Excelente' : Number(metrics.avgIterations) <= 4 ? 'Pode melhorar' : 'Especificação fraca'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-text-muted">
            <BarChart3 size={16} />
            <span className="text-xs font-medium">Score Médio</span>
          </div>
          <p className="text-2xl font-bold">{metrics.avgScore}<span className="text-sm font-normal text-text-muted">/5</span></p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-text-muted">
            <TrendingUp size={16} />
            <span className="text-xs font-medium">Avaliadas</span>
          </div>
          <p className="text-2xl font-bold">{metrics.evaluated}<span className="text-sm font-normal text-text-muted">/{metrics.total}</span></p>
        </div>
      </div>

      {/* Iteration Distribution */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium mb-3">Distribuição de Iterações</h4>
        <div className="flex gap-4">
          <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{metrics.iterationDistribution.good}</p>
            <p className="text-xs text-green-600 mt-1">1-2 iterações (Bom)</p>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{metrics.iterationDistribution.warning}</p>
            <p className="text-xs text-yellow-600 mt-1">3-4 iterações (Atenção)</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{metrics.iterationDistribution.bad}</p>
            <p className="text-xs text-red-600 mt-1">5+ iterações (Fraco)</p>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-surface border border-border rounded-lg p-4 bg-primary-50">
        <h4 className="text-sm font-medium text-primary-800 mb-1">Objetivo do Sistema</h4>
        <p className="text-sm text-primary-700">
          1 geração → 1 pequeno ajuste → pronto.
        </p>
        <p className="text-xs text-primary-600 mt-2">
          Se você está precisando 3, 4, 5 ajustes por feature → o sistema de especificação está fraco.
        </p>
      </div>
    </div>
  )
}
