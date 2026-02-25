import { useState } from 'react'
import { useSettingsStore } from './store/settings'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { PromptLibrary } from './pages/PromptLibrary'
import { SystemImprovement } from './pages/SystemImprovement'
import { SettingsModal } from './components/settings/SettingsModal'
import { MetricsPanel } from './components/metrics/MetricsPanel'
import { useAutoEnrichment } from './hooks/useAutoEnrichment'

export default function App() {
  const { activeBoard } = useSettingsStore()
  const [showNewCard, setShowNewCard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMetrics] = useState(false)

  // Auto-trigger Gemini enrichment when cards enter "enriquecimento" column
  useAutoEnrichment()

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onNewCard={activeBoard === 'features' ? () => setShowNewCard(true) : undefined}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 overflow-hidden">
          {activeBoard === 'features' && !showMetrics && (
            <KanbanBoard
              showNewCard={showNewCard}
              onCloseNewCard={() => setShowNewCard(false)}
            />
          )}
          {activeBoard === 'features' && showMetrics && <MetricsPanel />}
          {activeBoard === 'prompt-library' && <PromptLibrary />}
          {activeBoard === 'system-improvement' && <SystemImprovement />}
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
