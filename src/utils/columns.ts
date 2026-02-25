import type { Column } from '../types'

export const COLUMNS: Column[] = [
  {
    id: 'input-inicial',
    title: 'Input Inicial',
    description: 'Formulário de entrada: título, descrição, anexos, tipo, branch, selects',
    color: '#3b82f6',
  },
  {
    id: 'enriquecimento',
    title: 'Enriquecimento de Contexto',
    description: 'Gemini analisa input, aplica General Rules, estrutura prompt de alta qualidade',
    color: '#8b5cf6',
  },
  {
    id: 'revisao-prompt',
    title: 'Revisão Humana do Prompt',
    description: 'Revisar clareza, especificidade, alinhamento arquitetural, escopo e critérios',
    color: '#f59e0b',
  },
  {
    id: 'execucao',
    title: 'Execução pelo Code Agent',
    description: 'Prompt final enviado ao agente de código. Registrar versão, output e commits',
    color: '#22c55e',
  },
  {
    id: 'revisao-tecnica',
    title: 'Revisão Técnica',
    description: 'Inspecionar código: padrões, convenções, débito técnico, duplicação',
    color: '#06b6d4',
  },
  {
    id: 'avaliacao-accuracy',
    title: 'Avaliação de Accuracy',
    description: 'Avaliar o PROMPT (não o código): especificidade, contexto, restrições, score 1-5',
    color: '#ef4444',
  },
]
