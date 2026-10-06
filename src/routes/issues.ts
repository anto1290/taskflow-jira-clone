import { Router, Request, Response } from 'express';
import { PrismaClient, IssueStatus, IssuePriority } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ponytail: move project membership check into a reusable helper when other routes need it

async function requireAccess(userId: string, projectId: string) {
  const member = await prisma.projectMember.findFirst({
    where: { userId, projectId },
  });
  if (!member) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return member;
}

function parseFilters(q: string) {
  const params: Record<string, any> = {};
  for (const pair of q.split('&')) {
    const [k, v] = pair.split('=');
    if (!k) continue;
    const val = decodeURIComponent(v ?? '');
    if (k === 'status' && (val in IssueStatus)) params.status = val as IssueStatus;
    else if (k === 'priority' && (val in IssuePriority)) params.priority = val as IssuePriority;
    else if (k === 'assigneeId') params.assigneeId = val || null;
    else if (k === 'projectId') params.projectId = val;
    else if (k === 'sprintId') params.sprintId = val || null;
  }
  return params;
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const filters = parseFilters(req.url.split('?')[1] ?? '');
  if (filters.projectId) await requireAccess((req as any).user.id, filters.projectId);

  const issues = await prisma.issue.findMany({
    where: filters,
    include: { assignee: { select: { id: true, name: true, email: true } }, project: { select: { id: true, key: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(issues);
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { projectId, title, description, priority, sprintId, labelIds } = req.body;
  if (!projectId || !title) return res.status(400).json({ error: 'projectId and title are required' });

  await requireAccess((req as any).user.id, projectId);

  // Generate issue key: PROJECT-<last+1>
  const last = await prisma.issue.findFirst({
    where: { projectId },
    orderBy: { key: 'desc' },
    select: { key: true },
  });
  const num = last ? parseInt(last.key.slice(projectId.length + 1)) + 1 : 1;
  const key = `${projectId.toUpperCase()}-${num}`;

  const issue = await prisma.issue.create({
    data: {
      key,
      title,
      description,
      priority: priority ?? 'MEDIUM',
      creatorId: (req as any).user.id,
      projectId,
      sprintId: sprintId || null,
      labels: labelIds?.length ? { connect: labelIds.map((id: string) => ({ id })) } : undefined,
    },
    include: { assignee: true, labels: true, project: { select: { id: true, key: true } } },
  });
  res.status(201).json(issue);
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.status && !(updates.status in IssueStatus)) return res.status(400).json({ error: 'Invalid status' });
  if (updates.priority && !(updates.priority in IssuePriority)) return res.status(400).json({ error: 'Invalid priority' });

  const issue = await prisma.issue.findUnique({ where: { id }, select: { projectId: true } });
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  await requireAccess((req as any).user.id, issue.projectId);

  const data: any = { ...updates };
  if (updates.labelIds !== undefined) {
    data.labels = { set: updates.labelIds.map((lid: string) => ({ id: lid })) };
  }

  const issueUpdated = await prisma.issue.update({ where: { id }, data });
  res.json(issueUpdated);
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const issue = await prisma.issue.findUnique({ where: { id }, select: { projectId: true } });
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  await requireAccess((req as any).user.id, issue.projectId);

  await prisma.issue.delete({ where: { id } });
  res.status(204).end();
});

export default router;
