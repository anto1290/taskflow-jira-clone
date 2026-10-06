'use client';

import React, { memo, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Issue, IssueStatus } from '@/types';
import { IssueCard } from './IssueCard';

// ─── Sortable card wrapper ────────────────────────────────────────────────────

interface SortableIssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
}

const SortableIssueCard = memo(({ issue, onClick }: SortableIssueCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { type: 'IssueCard', issue },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCard issue={issue} onClick={onClick} />
    </div>
  );
});

SortableIssueCard.displayName = 'SortableIssueCard';

// ─── Kanban column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: IssueStatus;
  label: string;
  count: number;
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
}

const KanbanColumn = memo(({ status, label, count, issues, onIssueClick }: KanbanColumnProps) => {
  return (
    <div
      className="flex flex-col w-72 shrink-0 bg-surface-900/50 rounded-lg border border-neutral-800"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!onDrop) return;
        const data = e.dataTransfer.getData('text/plain');
        if (data) onDrop(status, [data]);
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{label}</span>
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className={`w-2 h-2 rounded-full ${
          status === 'TODO' ? 'bg-neutral-500' :
          status === 'IN_PROGRESS' ? 'bg-primary-400' :
          status === 'IN_REVIEW' ? 'bg-accent-amber-400' :
          status === 'DONE' ? 'bg-success-400' :
          'bg-neutral-500'
        }`} aria-hidden="true" />
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))}>
          <SortableContext
            items={issues.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {issues.map((issue) => (
              <SortableIssueCard
                key={issue.id}
                issue={issue}
                onClick={onIssueClick}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onMoveIssue?: (issueId: string, newStatus: IssueStatus, newSprintId?: string | null) => void;
}

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DONE', label: 'Done' },
];

export function KanbanBoard({ issues, onIssueClick, onMoveIssue }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !onMoveIssue) return;

      const issueId = active.id as string;
      const overId = over.id as string;

      // Determine target column
      const targetColumn = COLUMNS.find((col) => col.status === overId);
      if (targetColumn) {
        onMoveIssue(issueId, targetColumn.status);
        return;
      }

      // Dropping on a card — move before that card in the same column
      const overIssue = issues.find((i) => i.id === overId);
      if (overIssue) {
        onMoveIssue(issueId, overIssue.status);
      }
    },
    [issues, onMoveIssue]
  );

  // Group issues by status
  const grouped = COLUMNS.reduce<Record<IssueStatus, Issue[]>>((acc, col) => {
    acc[col.status] = issues.filter((i) => i.status === col.status);
    return acc;
  }, {} as Record<IssueStatus, Issue[]>);

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            count={grouped[status].length}
            issues={grouped[status]}
            onIssueClick={onIssueClick}
          />
        ))}
      </DndContext>
    </div>
  );
}
