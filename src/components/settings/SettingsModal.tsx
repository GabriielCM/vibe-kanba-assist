import { useState, useEffect } from 'react'
import { X, Key, Github, Eye, EyeOff, LogOut, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSettingsStore } from '../../store/settings'

interface SettingsModalProps {
  onClose: () => void
}

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error'

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

  const [activeTab, setActiveTab] = useState<'api-keys' | 'github'>('api-keys')

  // --- Gemini state ---
  const [geminiKey, setGeminiKey] = useState(apiKeys.geminiApiKey || '')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [geminiStatus, setGeminiStatus] = useState<ValidationStatus>('idle')
  const [geminiMsg, setGeminiMsg] = useState('')

  // --- GitHub state ---
  const [ghToken, setGhToken] = useState(apiKeys.githubClientId || '')
  const [showGhToken, setShowGhToken] = useState(false)
  const [ghStatus, setGhStatus] = useState<ValidationStatus>(githubUser ? 'success' : 'idle')
  const [ghMsg, setGhMsg] = useState(githubUser ? `Conectado como @${githubUser.login}` : '')

  // Sync gemini key from store if it changes externally
  useEffect(() => {
    if (apiKeys.geminiApiKey && !geminiKey) {
      setGeminiKey(apiKeys.geminiApiKey)
    }
  }, [apiKeys.geminiApiKey])

  // Sync gh token from store
  useEffect(() => {
    if (apiKeys.githubClientId && !ghToken) {
      setGhToken(apiKeys.githubClientId)
    }
  }, [apiKeys.githubClientId])

  // =====================
  // GEMINI: Save & Validate
  // =====================
  async function saveGeminiKey() {
    const key = geminiKey.trim()
    if (!key) {
      setGeminiStatus('error')
      setGeminiMsg('Insira uma API Key.')
      return
    }

    setGeminiStatus('validating')
    setGeminiMsg('Verificando conexão com Gemini...')

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
          }),
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        const errMsg = errData?.error?.message || `HTTP ${res.status}`
        throw new Error(errMsg)
      }

      // Success — persist
      setApiKeys({ geminiApiKey: key })
      setGeminiStatus('success')
      setGeminiMsg('Conexão verificada e API Key salva.')
    } catch (err) {
      setGeminiStatus('error')
      setGeminiMsg(err instanceof Error ? err.message : 'Erro ao validar API Key.')
    }
  }

  // =====================
  // GITHUB: Save & Validate
  // =====================
  async function saveGithubToken() {
    const token = ghToken.trim()
    if (!token) {
      setGhStatus('error')
      setGhMsg('Insira um Personal Access Token.')
      return
    }

    setGhStatus('validating')
    setGhMsg('Verificando conexão com GitHub...')

    try {
      // 1. Validate token by fetching user
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!userRes.ok) {
        if (userRes.status === 401) throw new Error('Token inválido ou expirado.')
        throw new Error(`GitHub API error: ${userRes.status}`)
      }

      const userData = await userRes.json()

      // 2. Fetch repos
      const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: { Authorization: `Bearer ${token}` },
      })

      let repos: unknown[] = []
      if (reposRes.ok) {
        repos = await reposRes.json()
      }

      // 3. Persist everything
      setApiKeys({ githubClientId: token })
      setGithubUser(userData)
      setGithubRepos(repos as typeof githubRepos)

      setGhStatus('success')
      setGhMsg(`Conectado como @${userData.login} — ${repos.length} repositórios carregados.`)
    } catch (err) {
      setGhStatus('error')
      setGhMsg(err instanceof Error ? err.message : 'Erro ao conectar com GitHub.')
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
    setGhStatus('idle')
    setGhMsg('')
  }

  // Status badge component
  function StatusBadge({ status, message }: { status: ValidationStatus; message: string }) {
    if (status === 'idle' || !message) return null
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mt-3 ${
        status === 'validating' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
        status === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
        'bg-red-50 border border-red-200 text-red-700'
      }`}>
        {status === 'validating' && <Loader2 size={14} className="animate-spin" />}
        {status === 'success' && <CheckCircle size={14} />}
        {status === 'error' && <AlertCircle size={14} />}
        <span className="text-xs font-medium">{message}</span>
      </div>
    )
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
            <span className="flex items-center gap-2">
              <Github size={14} /> GitHub
              {githubUser && <CheckCircle size={12} className="text-green-500" />}
            </span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ==================== API KEYS TAB ==================== */}
          {activeTab === 'api-keys' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value)
                      if (geminiStatus !== 'idle') setGeminiStatus('idle')
                      setGeminiMsg('')
                    }}
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

              <button
                onClick={saveGeminiKey}
                disabled={geminiStatus === 'validating' || !geminiKey.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 w-full justify-center"
              >
                {geminiStatus === 'validating'
                  ? <><Loader2 size={16} className="animate-spin" /> Verificando...</>
                  : <><Save size={16} /> Salvar e Verificar Conexão</>
                }
              </button>

              <StatusBadge status={geminiStatus} message={geminiMsg} />

              {/* Show if already saved */}
              {apiKeys.geminiApiKey && geminiStatus === 'idle' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    API Key salva ({apiKeys.geminiApiKey.substring(0, 8)}...)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ==================== GITHUB TAB ==================== */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Token input — always visible */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  GitHub Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type={showGhToken ? 'text' : 'password'}
                    value={ghToken}
                    onChange={(e) => {
                      setGhToken(e.target.value)
                      if (ghStatus === 'error') {
                        setGhStatus('idle')
                        setGhMsg('')
                      }
                    }}
                    placeholder="ghp_..."
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGhToken(!showGhToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary"
                  >
                    {showGhToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  GitHub Settings &rarr; Developer Settings &rarr; Personal Access Tokens (scope: repo)
                </p>
              </div>

              <button
                onClick={saveGithubToken}
                disabled={ghStatus === 'validating' || !ghToken.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 w-full justify-center"
              >
                {ghStatus === 'validating'
                  ? <><Loader2 size={16} className="animate-spin" /> Verificando...</>
                  : <><Github size={16} /> Salvar e Verificar Conexão</>
                }
              </button>

              <StatusBadge status={ghStatus} message={ghMsg} />

              {/* Connected user info */}
              {githubUser && (
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
              )}

              {/* Repo selector — only when connected */}
              {githubUser && githubRepos.length > 0 && (
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
                </div>
              )}

              {selectedRepo && (
                <div className="p-3 bg-surface-secondary rounded-lg text-xs text-text-muted">
                  <p><span className="font-medium text-text-secondary">Repo:</span> {selectedRepo.full_name}</p>
                  <p><span className="font-medium text-text-secondary">Branch padrão:</span> {selectedRepo.default_branch}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
