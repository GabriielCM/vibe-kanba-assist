import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiKeysConfig, GitHubUser, GitHubRepo, GitHubBranch, ActiveBoard } from '../types'

interface SettingsState {
  activeBoard: ActiveBoard
  setActiveBoard: (board: ActiveBoard) => void

  apiKeys: ApiKeysConfig
  setApiKeys: (keys: Partial<ApiKeysConfig>) => void

  githubUser: GitHubUser | null
  setGithubUser: (user: GitHubUser | null) => void

  githubRepos: GitHubRepo[]
  setGithubRepos: (repos: GitHubRepo[]) => void

  selectedRepo: GitHubRepo | null
  setSelectedRepo: (repo: GitHubRepo | null) => void

  branches: GitHubBranch[]
  setBranches: (branches: GitHubBranch[]) => void

  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeBoard: 'features',
      setActiveBoard: (board) => set({ activeBoard: board }),

      apiKeys: {
        geminiApiKey: '',
        githubClientId: '',
        githubClientSecret: '',
      },
      setApiKeys: (keys) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...keys },
        })),

      githubUser: null,
      setGithubUser: (user) => set({ githubUser: user }),

      githubRepos: [],
      setGithubRepos: (repos) => set({ githubRepos: repos }),

      selectedRepo: null,
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),

      branches: [],
      setBranches: (branches) => set({ branches }),

      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'vibe-kanban-settings',
      partialize: (state) => ({
        activeBoard: state.activeBoard,
        apiKeys: state.apiKeys,
        sidebarOpen: state.sidebarOpen,
        githubUser: state.githubUser,
        githubRepos: state.githubRepos,
        selectedRepo: state.selectedRepo,
        branches: state.branches,
      }),
    }
  )
)
