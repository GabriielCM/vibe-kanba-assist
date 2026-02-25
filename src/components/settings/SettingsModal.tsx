import { useState, useEffect } from 'react'
import { X, Key, Github, Eye, EyeOff, RefreshCw, LogOut } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    apiKeys,
    setApiKeys,
    githubUser,
    setGithubUser,
    githubRepos,
    setGithubRepos,
    selectedRepo,
    setSelectedRepo,
    setBranches,
  } = useSettingsStore()

  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showGhSecret, setShowGhSecret] = useState(false)
  const [ghToken, setGhToken] = useState(apiKeys.githubClientId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'api-keys' | 'github'>('api-keys')

  // Reload repos if user is connected but repos are empty (e.g. after page reload)
  useEffect(() => {
    if (githubUser && apiKeys.githubClientId && githubRepos.length === 0) {
      reloadRepos()
    }
  }, [])

  async function reloadRepos() {
    if (!apiKeys.githubClientId) return
    try {
      const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: { Authorization: `Bearer ${apiKeys.githubClientId}` },
      })
      if (reposRes.ok) {
        const reposData = await reposRes.json()
        setGithubRepos(reposData)
      }
    } catch {
      // silently fail
    }
  }

  async function connectGithub() {
    if (!ghToken.trim()) {
      setError('Insira um Personal Access Token do GitHub.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${ghToken}` },
      })

      if (!userRes.ok) throw new Error('Token inválido')

      const userData = await userRes.json()
      setGithubUser(userData)

      const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: { Authorization: `Bearer ${ghToken}` },
      })

      if (reposRes.ok) {
        const reposData = await reposRes.json()
        setGithubRepos(reposData)
      }

      setApiKeys({ githubClientId: ghToken })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBranches(repoFullName: string) {
    const token = apiKeys.githubClientId || ghToken
    if (!token) return

    try {
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/branches?per_page=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setBranches(data)
      }
    } catch {
      // silently fail
    }
  }

  function selectRepo(repoId: number) {
    const repo = githubRepos.find((r) => r.id === repoId)
    if (repo) {
      setSelectedRepo(repo)
      fetchBranches(repo.full_name)
    }
  }

  function disconnect() {
    setGithubUser(null)
    setGithubRepos([])
    setSelectedRepo(null)
    setBranches([])
    setApiKeys({ githubClientId: '', githubClientSecret: '' })
    setGhToken('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-xl mx-4 mb-12">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Configurações</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === 'api-keys' ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted'
            }`}
          >
            <span className="flex items-center gap-2"><Key size={14} /> API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === 'github' ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted'
            }`}
          >
            <span className="flex items-center gap-2"><Github size={14} /> GitHub</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {activeTab === 'api-keys' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={apiKeys.geminiApiKey}
                    onChange={(e) => setApiKeys({ geminiApiKey: e.target.value })}
                    placeholder="AIza..."
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary"
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Usada para enriquecimento de contexto via Gemini API
                </p>
              </div>
            </>
          )}

          {activeTab === 'github' && (
            <>
              {githubUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <img src={githubUser.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{githubUser.name || githubUser.login}</p>
                      <p className="text-xs text-green-600">Conectado como @{githubUser.login}</p>
                    </div>
                    <button
                      onClick={disconnect}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      title="Desconectar"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Repositório
                    </label>
                    <select
                      value={selectedRepo?.id || ''}
                      onChange={(e) => selectRepo(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
                    >
                      <option value="">Selecionar repositório...</option>
                      {githubRepos.map((repo) => (
                        <option key={repo.id} value={repo.id}>{repo.full_name}</option>
                      ))}
                    </select>
                    {githubRepos.length === 0 && (
                      <button
                        onClick={reloadRepos}
                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <RefreshCw size={12} /> Recarregar repositórios
                      </button>
                    )}
                  </div>

                  {selectedRepo && (
                    <div className="p-3 bg-surface-secondary rounded-lg text-xs text-text-muted">
                      <p><span className="font-medium text-text-secondary">Repo:</span> {selectedRepo.full_name}</p>
                      <p><span className="font-medium text-text-secondary">Branch padrão:</span> {selectedRepo.default_branch}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      GitHub Personal Access Token
                    </label>
                    <div className="relative">
                      <input
                        type={showGhSecret ? 'text' : 'password'}
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGhSecret(!showGhSecret)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary"
                      >
                        {showGhSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Crie um token em GitHub Settings &rarr; Developer Settings &rarr; Personal Access Tokens
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    onClick={connectGithub}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Github size={16} />}
                    {loading ? 'Conectando...' : 'Conectar com GitHub'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
