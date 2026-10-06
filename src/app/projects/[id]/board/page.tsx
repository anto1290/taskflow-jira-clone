'use client';

import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/useApi';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/layouts';
import { useIssues, useUpdateIssue } from '@/hooks/useApi';
import { IssueStatus } from '@/types';

export default function ProjectBoardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;

  const { data: projectData, isLoading: projectLoading } = useProject(projectId);
  const { data: issuesData, isLoading: issuesLoading } = useIssues({ projectId });
  const updateIssue = useUpdateIssue();

  const project = projectData?.data;
  const issues = issuesData?.data ?? [];

  async function handleMoveIssue(issueId: string, newStatus: IssueStatus) {
    await updateIssue.mutateAsync({
      id: issueId,
      data: { status: newStatus },
    });
  }

  return (
    <div className="flex flex-col h-screen bg-surface-950">
      <Header
        title={project?.name ?? 'Loading…'}
        subtitle={project ? `${project.key} · ${issues.length} issues` : undefined}
      />
      <main className="flex-1 p-4 overflow-hidden">
        {projectLoading || issuesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
          </div>
        ) : (
          <KanbanBoard
            issues={issues}
            onMoveIssue={handleMoveIssue}
          />
        )}
      </main>
    </div>
  );
}
