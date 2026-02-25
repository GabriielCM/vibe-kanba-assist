import { useState } from 'react'
import { Play, Link, GitCommit, Plus, AlertTriangle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import type { FeatureCard } from '../../types'

interface ExecutionPanelProps {
  card: FeatureCard
}

export function ExecutionPanel({ card }: ExecutionPanelProps) {
  const { addCodeOutput } = useFeaturesStore()

  const latestPrompt = card.promptVersions[card.promptVersions.length - 1]
  const [commitLink, setCommitLink] = useState('')
  const [prLink, setPrLink] = useState('')
  const [structuralDiff, setStructuralDiff] = useState('')

  function registerOutput() {
    if (!latestPrompt) return
    addCodeOutput(card.id, {
      promptVersionId: latestPrompt.id,
      commitLink,
      prLink,
      structuralDiff,
    })
    setCommitLink('')
    setPrLink('')
    setStructuralDiff('')
  }

  if (!latestPrompt) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm">Nenhum prompt disponível para execução.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-text-primary">Execução pelo Code Agent</h4>
        <p className="text-xs text-text-muted mt-0.5">
          Registre o output da execução do prompt pelo code agent
        </p>
      </div>

      {/* Current Prompt to Execute */}
      <div className="border border-border rounded-lg p-4 bg-surface-secondary">
        <div className="flex items-center gap-2 mb-2">
          <Play size={14} className="text-green-600" />
          <span className="text-xs font-medium text-text-primary">
            Prompt v{latestPrompt.version} para execução
          </span>
        </div>
        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono max-h-[150px] overflow-y-auto">
          {latestPrompt.content}
        </pre>
      </div>

      {/* Register Output */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h5 className="text-sm font-medium text-text-primary">Registrar Output</h5>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Link do Commit</label>
          <div className="flex items-center gap-2">
            <GitCommit size={14} className="text-text-muted" />
            <input
              type="text"
              value={commitLink}
              onChange={(e) => setCommitLink(e.target.value)}
              placeholder="https://github.com/..."
              className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Link do PR</label>
          <div className="flex items-center gap-2">
            <Link size={14} className="text-text-muted" />
            <input
              type="text"
              value={prLink}
              onChange={(e) => setPrLink(e.target.value)}
              placeholder="https://github.com/.../pull/..."
              className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Diferença Estrutural Detectada</label>
          <textarea
            value={structuralDiff}
            onChange={(e) => setStructuralDiff(e.target.value)}
            placeholder="Descreva as diferenças estruturais entre o esperado e o implementado..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
        </div>

        <button
          onClick={registerOutput}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={14} /> Registrar Output
        </button>
      </div>

      {/* Previous Outputs */}
      {card.codeOutputs.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-text-primary">Outputs Registrados</h5>
          {card.codeOutputs.map((output) => (
            <div key={output.id} className="border border-border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Output v{output.version}</span>
                <span className="text-xs text-text-muted">
                  {new Date(output.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              {output.commitLink && (
                <p className="text-xs text-text-secondary">
                  <span className="font-medium">Commit:</span> {output.commitLink}
                </p>
              )}
              {output.prLink && (
                <p className="text-xs text-text-secondary">
                  <span className="font-medium">PR:</span> {output.prLink}
                </p>
              )}
              {output.structuralDiff && (
                <p className="text-xs text-text-secondary mt-1">
                  <span className="font-medium">Diff:</span> {output.structuralDiff}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
