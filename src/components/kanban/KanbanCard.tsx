import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GitBranch, Tag, IterationCcw } from 'lucide-react'
import type { FeatureCard, FeatureType } from '../../types'

const TYPE_COLORS: Record<FeatureType, string> = {
  feature: 'bg-blue-100 text-blue-700',
  bugfix: 'bg-red-100 text-red-700',
  refactor: 'bg-purple-100 text-purple-700',
  enhancement: 'bg-green-100 text-green-700',
  hotfix: 'bg-orange-100 text-orange-700',
}

interface KanbanCardProps {
  card: FeatureCard
  onClick: () => void
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-text-primary line-clamp-2">{card.title}</h4>
        {card.promptAccuracy && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            card.promptAccuracy.score >= 4 ? 'bg-green-100 text-green-700' :
            card.promptAccuracy.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {card.promptAccuracy.score}/5
          </span>
        )}
      </div>

      <p className="text-xs text-text-muted line-clamp-2 mb-3">{card.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[card.featureType]}`}>
          {card.featureType}
        </span>

        {card.branch && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <GitBranch size={12} />
            <span className="truncate max-w-[100px]">{card.branch}</span>
          </span>
        )}

        {card.iterationCount > 0 && (
          <span className="text-xs text-text-muted flex items-center gap-1 ml-auto">
            <IterationCcw size={12} />
            {card.iterationCount}
          </span>
        )}

        {card.promptVersions.length > 0 && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Tag size={12} />
            v{card.promptVersions.length}
          </span>
        )}
      </div>
    </div>
  )
}
