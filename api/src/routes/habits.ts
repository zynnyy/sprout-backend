import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const habitSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  color: z.string().optional(),
});

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function calcStreak(logs: { date: string; completed: boolean }[]): number {
  const completed = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (!completed.length) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const dateStr of completed) {
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((current.getTime() - d.getTime()) / 86400000);
    if (diff > 1) break;
    streak++;
    current = d;
  }
  return streak;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const today = toDateString(new Date());
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId! },
    include: {
      logs: { where: { date: today } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const result = habits.map((h) => ({
    ...h,
    completedToday: h.logs.some((l) => l.completed),
  }));
  res.json(result);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Free tier limit: 3 habits
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { isPro: true } });
  if (!user?.isPro) {
    const count = await prisma.habit.count({ where: { userId: req.userId! } });
    if (count >= 3) { res.status(403).json({ error: 'Free limit reached. Upgrade to Pro for unlimited habits.', upgrade: true }); return; }
  }

  const habit = await prisma.habit.create({
    data: { userId: req.userId!, ...parsed.data },
  });
  res.status(201).json({ ...habit, completedToday: false });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { logs: { orderBy: { date: 'desc' }, take: 90 } },
  });
  if (!habit) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...habit, streak: calcStreak(habit.logs) });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const parsed = habitSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const habit = await prisma.habit.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(habit);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.habit.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/:id/log', async (req: AuthRequest, res: Response) => {
  const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!habit) { res.status(404).json({ error: 'Not found' }); return; }

  const date = (req.body.date as string) ?? toDateString(new Date());
  const completed = req.body.completed !== false;

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: req.params.id, date } },
    update: { completed },
    create: { habitId: req.params.id, date, completed },
  });
  res.json(log);
});

router.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!habit) { res.status(404).json({ error: 'Not found' }); return; }

  const logs = await prisma.habitLog.findMany({
    where: { habitId: req.params.id },
    orderBy: { date: 'desc' },
    take: 90,
  });
  res.json({ logs, streak: calcStreak(logs) });
});

export default router;
