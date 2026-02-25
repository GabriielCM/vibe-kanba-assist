import { useState, useMemo } from 'react'
import { DndContext, type DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { COLUMNS } from '../../utils/columns'
import { useFeaturesStore } from '../../store/features'
import type { FeatureCard } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { CardDetail } from '../forms/CardDetail'
import { NewCardForm } from '../forms/NewCardForm'

interface KanbanBoardProps {
  showNewCard: boolean
  onCloseNewCard: () => void
}

export function KanbanBoard({ showNewCard, onCloseNewCard }: KanbanBoardProps) {
  const { cards, moveCard } = useFeaturesStore()
  const [selectedCard, setSelectedCard] = useState<FeatureCard | null>(null)
  const [activeCard, setActiveCard] = useState<FeatureCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const cardsByColumn = useMemo(() => {
    const map: Record<string, FeatureCard[]> = {}
    for (const col of COLUMNS) {
      map[col.id] = cards.filter((c) => c.columnId === col.id)
    }
    return map
  }, [cards])

  function handleDragStart(event: { active: { id: string | number } }) {
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const cardId = active.id as string
    const overId = over.id as string

    const isColumn = COLUMNS.some((col) => col.id === overId)
    if (isColumn) {
      moveCard(cardId, overId as FeatureCard['columnId'])
    } else {
      const overCard = cards.find((c) => c.id === overId)
      if (overCard) {
        moveCard(cardId, overCard.columnId)
      }
    }
  }

  const refreshedSelectedCard = selectedCard ? cards.find((c) => c.id === selectedCard.id) || null : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto h-full">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cardsByColumn[column.id] || []}
              onCardClick={setSelectedCard}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {showNewCard && <NewCardForm onClose={onCloseNewCard} />}

      {refreshedSelectedCard && (
        <CardDetail card={refreshedSelectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </>
  )
}
