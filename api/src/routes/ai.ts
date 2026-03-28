import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function isPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true, proExpiresAt: true } });
  if (!user) return false;
  return user.isPro && (!user.proExpiresAt || user.proExpiresAt > new Date());
}

async function ask(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });
  return (msg.content[0] as { type: string; text: string }).text;
}

// Suggest habits based on user's goals
router.post('/habit-suggestions', async (req: AuthRequest, res: Response) => {
  if (!await isPro(req.userId!)) { res.status(403).json({ error: 'Pro required', upgrade: true }); return; }

  const goals = await prisma.goal.findMany({ where: { userId: req.userId!, status: 'active' }, take: 5 });
  const goalTitles = goals.map((g) => g.title).join(', ') || 'general self-improvement';

  const text = await ask(
    `You are a personal development coach. Based on these goals: "${goalTitles}", suggest 5 daily habits that would help achieve them.
    Return ONLY a JSON array of objects with "title" and "description" fields. No extra text.
    Example: [{"title":"Morning meditation","description":"10 minutes of mindfulness to start the day"}]`
  );

  try {
    const suggestions = JSON.parse(text);
    res.json(suggestions);
  } catch {
    res.json([]);
  }
});

// Break a goal into actionable steps
router.post('/goal-breakdown', async (req: AuthRequest, res: Response) => {
  if (!await isPro(req.userId!)) { res.status(403).json({ error: 'Pro required', upgrade: true }); return; }

  const { goalId } = req.body;
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: req.userId! } });
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

  const text = await ask(
    `You are a personal development coach. Break this goal into 5-7 clear, actionable steps:
    Goal: "${goal.title}"
    ${goal.description ? `Description: "${goal.description}"` : ''}

    Return ONLY a JSON array of step title strings. No extra text.
    Example: ["Research what training plan to follow","Buy running shoes","Run 1km without stopping"]`
  );

  try {
    const steps = JSON.parse(text);
    res.json(steps);
  } catch {
    res.json([]);
  }
});

// Daily journal prompt based on mood
router.get('/journal-prompt', async (req: AuthRequest, res: Response) => {
  if (!await isPro(req.userId!)) { res.status(403).json({ error: 'Pro required', upgrade: true }); return; }

  const today = new Date().toISOString().split('T')[0];
  const mood = await prisma.moodEntry.findUnique({ where: { userId_date: { userId: req.userId!, date: today } } });

  const moodDesc = mood ? `mood level ${mood.mood}/5 and energy level ${mood.energy}/5` : 'an unknown mood';

  const text = await ask(
    `You are a thoughtful journaling coach. Generate a single, meaningful journal prompt for someone with ${moodDesc} today.
    Make it reflective and personal. Return ONLY the prompt text, no extra explanation.`
  );

  res.json({ prompt: text.trim() });
});

// Weekly insights based on habits, goals, mood
router.get('/weekly-insights', async (req: AuthRequest, res: Response) => {
  if (!await isPro(req.userId!)) { res.status(403).json({ error: 'Pro required', upgrade: true }); return; }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekStart = sevenDaysAgo.toISOString().split('T')[0];

  const [habits, goals, moods] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: req.userId! },
      include: { logs: { where: { date: { gte: weekStart }, completed: true } } },
    }),
    prisma.goal.findMany({ where: { userId: req.userId!, status: 'active' } }),
    prisma.moodEntry.findMany({ where: { userId: req.userId!, date: { gte: weekStart } }, orderBy: { date: 'asc' } }),
  ]);

  const habitSummary = habits.map((h) => `${h.title}: completed ${h.logs.length}/7 days`).join(', ');
  const avgMood = moods.length ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length).toFixed(1) : 'unknown';
  const goalTitles = goals.map((g) => `${g.title} (${g.progress}%)`).join(', ');

  const text = await ask(
    `You are a personal development coach giving a weekly review. Here's the data:
    Habits this week: ${habitSummary || 'none tracked'}
    Active goals: ${goalTitles || 'none'}
    Average mood: ${avgMood}/5

    Write a warm, encouraging 3-4 sentence weekly insight summary with one specific tip for next week.
    Be personal and motivating, not generic.`
  );

  res.json({ insights: text.trim() });
});

export default router;
