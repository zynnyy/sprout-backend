import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const entrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });
  res.json(entries);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const entry = await prisma.journalEntry.create({
    data: { userId: req.userId!, ...parsed.data },
  });
  res.status(201).json(entry);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(entry);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const parsed = entrySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const entry = await prisma.journalEntry.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(entry);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.journalEntry.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.journalEntry.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
