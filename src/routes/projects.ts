import { Router, Request, Response } from 'express';
import { PrismaClient, IssueStatus, IssuePriority } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ponytail: add pagination (cursor-based) when projects exceed ~100 rows per user

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const member = await prisma.projectMember.findMany({
    where: { userId: (req as any).user.id },
    include: { project: true },
  });
  res.json(member.map(m => m.project));
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { key, name, description } = req.body;
  if (!key || !name) return res.status(400).json({ error: 'key and name are required' });

  const project = await prisma.project.create({
    data: {
      key: key.toUpperCase(),
      name,
      description,
      ownerId: (req as any).user.id,
      members: { create: { userId: (req as any).user.id, role: 'OWNER' } },
    },
  });
  res.status(201).json(project);
});

export default router;
