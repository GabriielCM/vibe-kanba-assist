// ==========================================
// Kanban Column / Card Types
// ==========================================

export type FeatureType = 'feature' | 'bugfix' | 'refactor' | 'enhancement' | 'hotfix'

export type ColumnId =
  | 'input-inicial'
  | 'enriquecimento'
  | 'revisao-prompt'
  | 'execucao'
  | 'revisao-tecnica'
  | 'avaliacao-accuracy'

export interface GeneralSelect {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size: number
}

export interface PromptVersion {
  id: string
  version: number
  content: string
  createdAt: string
  analyzedFiles: string[]
  detectedPatterns: string[]
  structuralSuggestions: string[]
}

export interface CodeOutput {
  id: string
  version: number
  promptVersionId: string
  commitLink: string
  prLink: string
  structuralDiff: string
  createdAt: string
}

export interface TechnicalReview {
  followedPatterns: boolean
  brokeConvention: boolean
  technicalDebt: boolean
  createdDuplication: boolean
  unexpectedFiles: boolean
  notes: string
  reviewedAt: string
}

export interface PromptAccuracy {
  score: number // 1-5
  specificEnough: boolean
  missingContext: boolean
  missingRestrictions: boolean
  missingAcceptanceCriteria: boolean
  agentHadToGuess: boolean
  notes: string
  evaluatedAt: string
}

export type EnrichmentStatus = 'idle' | 'running' | 'done' | 'error'

export interface EnrichmentLogEntry {
  timestamp: string
  step: string
  detail: string
}

export interface FeatureCard {
  id: string
  columnId: ColumnId
  title: string
  description: string
  featureType: FeatureType
  branch: string
  attachments: Attachment[]
  generalSelects: string[] // IDs of selected GeneralSelects
  acceptanceCriteria: string[]
  promptVersions: PromptVersion[]
  codeOutputs: CodeOutput[]
  technicalReview: TechnicalReview | null
  promptAccuracy: PromptAccuracy | null
  enrichmentStatus: EnrichmentStatus
  enrichmentError: string | null
  enrichmentLogs: EnrichmentLogEntry[]
  enrichmentStep: string
  iterationCount: number
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: ColumnId
  title: string
  description: string
  color: string
}

// ==========================================
// Board 2 — Prompt Library
// ==========================================

export interface GeneralRule {
  id: string
  title: string
  content: string
  category: string
  enabled: boolean
  createdAt: string
}

export interface PromptTemplate {
  id: string
  name: string
  featureType: FeatureType
  template: string
  variables: string[]
  createdAt: string
}

export interface PromptExample {
  id: string
  title: string
  prompt: string
  result: string
  score: number
  featureType: FeatureType
  createdAt: string
}

// ==========================================
// Board 3 — System Improvement
// ==========================================

export type ImprovementType =
  | 'template-adjustment'
  | 'new-select'
  | 'search-heuristic'
  | 'evaluation-criteria'

export type ImprovementStatus = 'backlog' | 'in-progress' | 'done'

export interface ImprovementCard {
  id: string
  title: string
  description: string
  type: ImprovementType
  status: ImprovementStatus
  createdAt: string
  completedAt: string | null
}

// ==========================================
// Settings / Config
// ==========================================

export interface ApiKeysConfig {
  geminiApiKey: string
  githubClientId: string
  githubClientSecret: string
}

export interface GitHubUser {
  login: string
  avatar_url: string
  name: string
  repos_url: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  default_branch: string
  branches_url: string
}

export interface GitHubBranch {
  name: string
}

// ==========================================
// App State
// ==========================================

export type ActiveBoard = 'features' | 'prompt-library' | 'system-improvement'
