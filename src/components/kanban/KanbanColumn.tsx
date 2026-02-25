import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column, FeatureCard } from '../../types'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  column: Column
  cards: FeatureCard[]
  onCardClick: (card: FeatureCard) => void
}

export function KanbanColumn({ column, cards, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-text-primary truncate">{column.title}</h3>
        <span className="ml-auto text-xs font-medium text-text-muted bg-surface-hover rounded-full px-2 py-0.5">
          {cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 rounded-lg space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : 'bg-surface-secondary'
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-text-muted">
            Arraste cards para cá
          </div>
        )}
      </div>
    </div>
  )
}
