import { LayoutDashboard, BookOpen, Settings, BarChart3, Github, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'
import type { ActiveBoard } from '../../types'

const NAV_ITEMS: { id: ActiveBoard; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'features', label: 'Gestão de Features', icon: LayoutDashboard },
  { id: 'prompt-library', label: 'Biblioteca de Prompts', icon: BookOpen },
  { id: 'system-improvement', label: 'Melhoria do Sistema', icon: Wrench },
]

export function Sidebar() {
  const { activeBoard, setActiveBoard, sidebarOpen, toggleSidebar, githubUser } = useSettingsStore()

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col transition-all duration-200 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && (
          <h1 className="text-lg font-bold text-primary-600 truncate">Vibe Kanban</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeBoard === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveBoard(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
              title={item.label}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-2 space-y-1 border-t border-border">
        <button
          onClick={() => setActiveBoard('features')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-hover"
          title="Métricas"
        >
          <BarChart3 size={20} />
          {sidebarOpen && <span>Métricas</span>}
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-hover"
          title="Configurações"
        >
          <Settings size={20} />
          {sidebarOpen && <span>Configurações</span>}
        </button>
      </div>

      {githubUser && sidebarOpen && (
        <div className="p-3 border-t border-border flex items-center gap-2">
          <img
            src={githubUser.avatar_url}
            alt={githubUser.login}
            className="w-8 h-8 rounded-full"
          />
          <div className="truncate">
            <p className="text-sm font-medium truncate">{githubUser.name || githubUser.login}</p>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Github size={12} /> {githubUser.login}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
