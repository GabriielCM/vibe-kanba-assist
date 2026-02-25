import { useRef, useEffect } from 'react'
import { Sparkles, Loader2, FileCode, AlertCircle, CheckCircle, RotateCcw, FolderTree, Search, BookOpen, Cpu, AlertTriangle } from 'lucide-react'
import { useFeaturesStore } from '../../store/features'
import { useSettingsStore } from '../../store/settings'
import type { EnrichmentLogEntry } from '../../types'

interface EnrichmentPanelProps {
  card: { id: string }
}

const STEP_ICONS: Record<string, typeof Sparkles> = {
  start: Sparkles,
  tree: FolderTree,
  structure: FolderTree,
  read: FileCode,
  relevance: Search,
  patterns: BookOpen,
  gemini: Cpu,
  step: Loader2,
  done: CheckCircle,
  error: AlertCircle,
  warn: AlertTriangle,
}

function LogLine({ entry }: { entry: EnrichmentLogEntry }) {
  const Icon = STEP_ICONS[entry.step] || FileCode
  const isError = entry.step === 'error'
  const isWarn = entry.step === 'warn'
  const isDone = entry.step === 'done'
  const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR')

  return (
    <div className={`flex items-start gap-2 px-2 py-1 text-xs font-mono ${
      isError ? 'text-red-400' : isWarn ? 'text-yellow-400' : isDone ? 'text-green-400' : 'text-gray-300'
    }`}>
      <Icon size={12} className="mt-0.5 shrink-0" />
      <span className="text-gray-500 shrink-0">{time}</span>
      <span className="break-all">{entry.detail}</span>
    </div>
  )
}

export function EnrichmentPanel({ card: cardProp }: EnrichmentPanelProps) {
  // Read card data DIRECTLY from the store via selector — this ensures we always
  // get the latest state, not stale props from the parent component.
  const card = useFeaturesStore((state) => state.cards.find((c) => c.id === cardProp.id))
  const { setEnrichmentStatus, clearEnrichmentLogs } = useFeaturesStore()
  const { apiKeys, selectedRepo } = useSettingsStore()
  const logEndRef = useRef<HTMLDivElement>(null)

  const hasApiKey = !!apiKeys.geminiApiKey
  const hasRepo = !!selectedRepo && !!apiKeys.githubClientId

  const logs = card?.enrichmentLogs || []
  const enrichmentStatus = card?.enrichmentStatus || 'idle'
  const enrichmentStep = card?.enrichmentStep || ''
  const enrichmentError = card?.enrichmentError || null
  const promptVersions = card?.promptVersions || []
  const isRunning = enrichmentStatus === 'running'
  const latestPrompt = promptVersions[promptVersions.length - 1]

  // Auto-scroll logs to bottom whenever new logs arrive
  useEffect(() => {
    if (logs.length > 0) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length])

  function retryEnrichment() {
    if (!card) return
    clearEnrichmentLogs(card.id)
    setEnrichmentStatus(card.id, 'idle')
  }

  if (!card) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-text-primary">Enriquecimento de Contexto</h4>
          <p className="text-xs text-text-muted mt-0.5">
            {hasRepo
              ? `Analisa o código real de ${selectedRepo!.full_name} e gera prompt contextualizado`
              : 'Conecte um repositório GitHub para análise real do código'}
          </p>
        </div>
        {(enrichmentStatus === 'done' || enrichmentStatus === 'error') && (
          <button
            onClick={retryEnrichment}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RotateCcw size={16} />
            Regenerar
          </button>
        )}
      </div>

      {/* Warnings */}
      {!hasApiKey && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">API Key do Gemini não configurada</p>
            <p className="text-xs mt-0.5">Configure nas configurações para usar o enriquecimento.</p>
          </div>
        </div>
      )}

      {hasApiKey && !hasRepo && enrichmentStatus === 'idle' && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
          <div className="text-sm text-orange-800">
            <p className="font-medium">Repositório GitHub não conectado</p>
            <p className="text-xs mt-0.5">O prompt será gerado SEM análise de código. Conecte um repo nas configurações para enriquecimento real.</p>
          </div>
        </div>
      )}

      {/* Current step indicator */}
      {isRunning && enrichmentStep && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 border border-purple-200 rounded-lg">
          <Loader2 size={14} className="animate-spin text-purple-600" />
          <span className="text-sm font-medium text-purple-700">{enrichmentStep}</span>
        </div>
      )}

      {/* Real-time log terminal */}
      {logs.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-mono">enrichment pipeline</span>
            <span className="text-xs font-mono ml-auto">{logs.length} eventos</span>
          </div>
          <div className="bg-gray-950 p-2 max-h-[300px] overflow-y-auto">
            {logs.map((entry, i) => (
              <LogLine key={i} entry={entry} />
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-mono text-purple-400">
                <Loader2 size={12} className="animate-spin" />
                <span className="animate-pulse">processando...</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Status badge */}
      {enrichmentStatus === 'done' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle size={14} className="text-green-600" />
          <span className="text-xs font-medium text-green-700">
            Enriquecimento completo — {latestPrompt?.analyzedFiles?.length || 0} arquivos analisados, {promptVersions.length} versão(ões)
          </span>
        </div>
      )}

      {enrichmentStatus === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-600" />
          <span className="text-xs font-medium text-red-700 flex-1">{enrichmentError || 'Erro no enriquecimento'}</span>
          <button onClick={retryEnrichment} className="text-xs font-medium text-red-600 hover:text-red-700 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {enrichmentStatus === 'idle' && hasApiKey && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-border rounded-lg">
          <Sparkles size={14} className="text-text-muted" />
          <span className="text-xs text-text-muted">
            Mova o card para esta coluna para disparar automaticamente.
          </span>
        </div>
      )}

      {/* Analyzed files */}
      {latestPrompt && latestPrompt.analyzedFiles?.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <h5 className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1">
            <FileCode size={12} /> Arquivos Analisados ({latestPrompt.analyzedFiles.length})
          </h5>
          <div className="flex flex-wrap gap-1">
            {latestPrompt.analyzedFiles.map((f) => (
              <span key={f} className="text-xs font-mono px-2 py-0.5 bg-surface-secondary rounded text-text-secondary">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected patterns */}
      {latestPrompt && latestPrompt.detectedPatterns?.length > 0 && (
        <div className="border border-border rounded-lg p-3">
          <h5 className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1">
            <BookOpen size={12} /> Padrões Detectados
          </h5>
          <div className="flex flex-wrap gap-1">
            {latestPrompt.detectedPatterns.map((p) => (
              <span key={p} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prompt versions */}
      {promptVersions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <FileCode size={14} />
            {promptVersions.length} versão(ões) gerada(s)
          </div>

          {promptVersions.map((pv) => (
            <div key={pv.id} className="border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-surface-secondary rounded-t-lg border-b border-border">
                <span className="text-xs font-medium text-text-primary">
                  Versão {pv.version}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(pv.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-4">
                <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary p-3 rounded-lg max-h-[300px] overflow-y-auto">
                  {pv.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
