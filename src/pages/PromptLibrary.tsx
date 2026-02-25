import { useState } from 'react'
import { Plus, Trash2, BookOpen, ToggleLeft, ToggleRight, FileText, Award } from 'lucide-react'
import { usePromptsStore } from '../store/prompts'
import type { FeatureType } from '../types'

type Tab = 'rules' | 'selects' | 'templates' | 'examples'

export function PromptLibrary() {
  const [activeTab, setActiveTab] = useState<Tab>('rules')

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'rules', label: 'General Rules', icon: BookOpen },
    { id: 'selects', label: 'General Selects', icon: ToggleLeft },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'examples', label: 'Exemplos', icon: Award },
  ]

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'rules' && <RulesSection />}
      {activeTab === 'selects' && <SelectsSection />}
      {activeTab === 'templates' && <TemplatesSection />}
      {activeTab === 'examples' && <ExamplesSection />}
    </div>
  )
}

function RulesSection() {
  const { generalRules, addRule, updateRule, deleteRule } = usePromptsStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')

  function handleAdd() {
    if (!title.trim() || !content.trim()) return
    addRule({ title, content, category, enabled: true })
    setTitle('')
    setContent('')
    setCategory('')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">General Rules (Constituição)</h3>
          <p className="text-sm text-text-muted">Regras fundamentais que guiam a geração de prompts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Nova Regra
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da regra"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo da regra..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria (ex: arquitetura, segurança, estilo)"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {generalRules.map((rule) => (
          <div key={rule.id} className="border border-border rounded-lg p-4 bg-surface flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium">{rule.title}</h4>
                {rule.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted">
                    {rule.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{rule.content}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                className={`p-1 ${rule.enabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
              <button onClick={() => deleteRule(rule.id)} className="p-1 text-text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {generalRules.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">Nenhuma regra cadastrada.</p>
        )}
      </div>
    </div>
  )
}

function SelectsSection() {
  const { generalSelects, addSelect, updateSelect, deleteSelect } = usePromptsStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    addSelect({ name, description, enabled: false })
    setName('')
    setDescription('')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">General Selects</h3>
          <p className="text-sm text-text-muted">Modificadores de comportamento ativados por feature</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Novo Select
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do select"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do comportamento..."
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {generalSelects.map((select) => (
          <div key={select.id} className="border border-border rounded-lg p-4 bg-surface">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium">{select.name}</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSelect(select.id, { enabled: !select.enabled })}
                  className={`p-1 ${select.enabled ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {select.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => deleteSelect(select.id)} className="p-1 text-text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-text-muted">{select.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplatesSection() {
  const { templates, addTemplate, deleteTemplate } = usePromptsStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [featureType, setFeatureType] = useState<FeatureType>('feature')
  const [template, setTemplate] = useState('')

  function handleAdd() {
    if (!name.trim() || !template.trim()) return
    addTemplate({ name, featureType, template, variables: [] })
    setName('')
    setTemplate('')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Prompt</h3>
          <p className="text-sm text-text-muted">Templates reutilizáveis por tipo de feature</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Novo Template
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do template"
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value as FeatureType)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
            >
              <option value="feature">Feature</option>
              <option value="bugfix">Bugfix</option>
              <option value="refactor">Refactor</option>
              <option value="enhancement">Enhancement</option>
              <option value="hotfix">Hotfix</option>
            </select>
          </div>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Template do prompt. Use {{variavel}} para variáveis..."
            rows={6}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="border border-border rounded-lg p-4 bg-surface">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{t.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{t.featureType}</span>
              </div>
              <button onClick={() => deleteTemplate(t.id)} className="p-1 text-text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
            <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary p-2 rounded max-h-[120px] overflow-y-auto">
              {t.template}
            </pre>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">Nenhum template cadastrado.</p>
        )}
      </div>
    </div>
  )
}

function ExamplesSection() {
  const { examples, addExample, deleteExample } = usePromptsStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [score, setScore] = useState(5)
  const [featureType, setFeatureType] = useState<FeatureType>('feature')

  function handleAdd() {
    if (!title.trim() || !prompt.trim()) return
    addExample({ title, prompt, result, score, featureType })
    setTitle('')
    setPrompt('')
    setResult('')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exemplos de Prompts</h3>
          <p className="text-sm text-text-muted">Prompts que funcionaram bem como referência</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Novo Exemplo
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do exemplo"
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value as FeatureType)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface"
            >
              <option value="feature">Feature</option>
              <option value="bugfix">Bugfix</option>
              <option value="refactor">Refactor</option>
              <option value="enhancement">Enhancement</option>
              <option value="hotfix">Hotfix</option>
            </select>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="O prompt que foi usado..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="O resultado obtido..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Score:</label>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScore(s)}
                className={score >= s ? 'text-yellow-500' : 'text-gray-300'}
              >
                <Star size={20} fill={score >= s ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-hover">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {examples.map((ex) => (
          <div key={ex.id} className="border border-border rounded-lg p-4 bg-surface">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{ex.title}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{ex.featureType}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} className={ex.score >= s ? 'text-yellow-500' : 'text-gray-300'} fill={ex.score >= s ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              <button onClick={() => deleteExample(ex.id)} className="p-1 text-text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
            <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary p-2 rounded mb-2 max-h-[100px] overflow-y-auto">
              {ex.prompt}
            </pre>
            {ex.result && (
              <p className="text-xs text-text-muted">{ex.result}</p>
            )}
          </div>
        ))}
        {examples.length === 0 && (
          <p className="text-sm text-text-muted text-center py-8">Nenhum exemplo cadastrado.</p>
        )}
      </div>
    </div>
  )
}

// Re-export Star for use in ExamplesSection
function Star(props: { size: number; className?: string; fill?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill={props.fill || 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
