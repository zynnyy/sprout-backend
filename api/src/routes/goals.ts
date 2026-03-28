import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

const stepSchema = z.object({
  title: z.string().min(1),
  order: z.number().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId! },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(goals);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Free tier limit: 2 active goals
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { isPro: true } });
  if (!user?.isPro) {
    const count = await prisma.goal.count({ where: { userId: req.userId!, status: 'active' } });
    if (count >= 2) { res.status(403).json({ error: 'Free limit reached. Upgrade to Pro for unlimited goals.', upgrade: true }); return; }
  }

  const { title, description, targetDate, progress, status } = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      progress: progress ?? 0,
      status: status ?? 'active',
    },
    include: { steps: true },
  });
  res.status(201).json(goal);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  if (!goal) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(goal);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const parsed = goalSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { targetDate, ...rest } = parsed.data;
  const goal = await prisma.goal.update({
    where: { id: req.params.id },
    data: { ...rest, targetDate: targetDate ? new Date(targetDate) : undefined },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  res.json(goal);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.goal.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/:id/steps', async (req: AuthRequest, res: Response) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) { res.status(404).json({ error: 'Not found' }); return; }

  const parsed = stepSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const step = await prisma.goalStep.create({
    data: { goalId: req.params.id, title: parsed.data.title, order: parsed.data.order ?? 0 },
  });
  res.status(201).json(step);
});

router.put('/:id/steps/:stepId', async (req: AuthRequest, res: Response) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) { res.status(404).json({ error: 'Not found' }); return; }

  const updateSchema = z.object({ title: z.string().optional(), completed: z.boolean().optional() });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const step = await prisma.goalStep.update({
    where: { id: req.params.stepId },
    data: parsed.data,
  });
  res.json(step);
});

router.delete('/:id/steps/:stepId', async (req: AuthRequest, res: Response) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.goalStep.delete({ where: { id: req.params.stepId } });
  res.json({ ok: true });
});

export default router;
