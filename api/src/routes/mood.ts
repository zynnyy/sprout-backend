import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const moodSchema = z.object({
  date: z.string().optional(),
  mood: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  note: z.string().optional(),
});

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

router.get('/today', async (req: AuthRequest, res: Response) => {
  const entry = await prisma.moodEntry.findUnique({
    where: { userId_date: { userId: req.userId!, date: todayString() } },
  });
  res.json(entry ?? null);
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const entries = await prisma.moodEntry.findMany({
    where: { userId: req.userId! },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(entries);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = moodSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const { date, mood, energy, note } = parsed.data;
  const dateStr = date ?? todayString();

  const entry = await prisma.moodEntry.upsert({
    where: { userId_date: { userId: req.userId!, date: dateStr } },
    update: { mood, energy, note },
    create: { userId: req.userId!, date: dateStr, mood, energy, note },
  });
  res.json(entry);
});

export default router;
