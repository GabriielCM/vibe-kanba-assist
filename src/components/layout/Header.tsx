import { Plus, Settings, Github } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'

interface HeaderProps {
  onNewCard?: () => void
  onOpenSettings?: () => void
}

export function Header({ onNewCard, onOpenSettings }: HeaderProps) {
  const { activeBoard, githubUser } = useSettingsStore()

  const titles: Record<string, string> = {
    features: 'Board 1 — Gestão de Features',
    'prompt-library': 'Board 2 — Biblioteca de Prompts',
    'system-improvement': 'Board 3 — Melhoria do Sistema',
  }

  const descriptions: Record<string, string> = {
    features: 'Fluxo completo de prompt-oriented development',
    'prompt-library': 'General Rules, Selects, Templates e Exemplos',
    'system-improvement': 'Ajustar templates, criar selects, melhorar heurísticas',
  }

  return (
    <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{titles[activeBoard]}</h2>
        <p className="text-sm text-text-muted mt-0.5">{descriptions[activeBoard]}</p>
      </div>
      <div className="flex items-center gap-2">
        {!githubUser && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover text-text-secondary"
          >
            <Github size={16} />
            Conectar GitHub
          </button>
        )}
        {onNewCard && (
          <button
            onClick={onNewCard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Nova Feature
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
          title="Configurações"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
