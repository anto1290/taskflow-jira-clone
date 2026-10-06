'use client';

import React, { memo, useCallback } from 'react';
import type { Issue, Label } from '@/types';

// ─── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<Issue['priority'], string> = {
  URGENT: 'bg-error-500/20 text-error-400',
  HIGH: 'bg-accent-rose-500/20 text-accent-rose-400',
  MEDIUM: 'bg-accent-amber-500/20 text-accent-amber-400',
  LOW: 'bg-success-500/20 text-success-400',
};

const TYPE_ICON: Record<Issue['issueType'], string> = {
  EPIC: '⬡',
  STORY: '◇',
  TASK: '▪',
  BUG: '⚠',
  SUB_TASK: '▸',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LabelBadgeProps {
  label: Label;
}

const LabelBadge = memo(({ label }: LabelBadgeProps) => (
  <span
    className="inline-flex items-center h-5 px-1.5 rounded text-xs font-medium shrink-0"
    style={{ backgroundColor: `${label.color}20`, color: label.color }}
  >
    {label.name}
  </span>
));

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

const Avatar = memo(({ name, size = 'sm' }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizeClass = size === 'md' ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]';
  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold shrink-0`}
      aria-label={name}
    >
      {initials}
    </div>
  );
});

// ─── IssueCard ────────────────────────────────────────────────────────────────

interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  draggable?: boolean;
}

export const IssueCard = memo(({ issue, onClick, draggable = true }: IssueCardProps) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!draggable) return;
      e.dataTransfer.setData('text/plain', issue.id);
      e.dataTransfer.effectAllowed = 'move';
      // subtle opacity feedback
      setTimeout(() => (e.currentTarget.style.opacity = '0.5'), 0);
    },
    [issue.id, draggable]
  );

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick?.(issue)}
      className="bg-surface-800 rounded-lg p-3 border border-neutral-800 shadow-sm hover:border-neutral-700 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 group"
      role="article"
      aria-label={`${issue.key}: ${issue.summary}`}
    >
      {/* Priority bar */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-l-lg" aria-hidden="true" />

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      {/* Key + summary */}
      <div className="flex items-start gap-2">
        <span className="text-xs text-neutral-500 font-mono shrink-0 mt-0.5">
          {issue.key}
        </span>
        <p className="text-sm font-medium text-primary leading-snug line-clamp-2">
          {issue.summary}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_STYLE[issue.priority]}`}
          >
            {issue.priority}
          </span>
          <span className="text-neutral-600 text-xs" aria-hidden="true">
            {TYPE_ICON[issue.issueType]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {issue.assignee && <Avatar name={issue.assignee.displayName} />}
          {issue.estimate !== null && issue.estimate !== undefined && (
            <span className="text-xs text-neutral-500">
              {issue.estimate}
              <span className="sr-only">story points</span>
            </span>
          )}
          {issue.commentCount > 0 && (
            <span className="text-xs text-neutral-600 flex items-center gap-0.5" aria-label={`${issue.commentCount} comments`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {issue.commentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

IssueCard.displayName = 'IssueCard';
