import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get subscription status (protected)
router.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isPro: true, proExpiresAt: true },
  });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }

  const isActive = user.isPro && (!user.proExpiresAt || user.proExpiresAt > new Date());
  res.json({ isPro: isActive, proExpiresAt: user.proExpiresAt });
});

// RevenueCat webhook (public — verified by shared secret)
router.post('/webhook', async (req: Request, res: Response) => {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret && req.headers['authorization'] !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  const event = req.body?.event;
  if (!event) { res.status(400).json({ error: 'No event' }); return; }

  const appUserId: string = event.app_user_id;
  const type: string = event.type;

  const ACTIVE_EVENTS = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'];
  const INACTIVE_EVENTS = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ revenuecatCustomerId: appUserId }, { id: appUserId }] },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    if (ACTIVE_EVENTS.includes(type)) {
      const expiresAt = event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: true, proExpiresAt: expiresAt, revenuecatCustomerId: appUserId },
      });
    } else if (INACTIVE_EVENTS.includes(type)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: false },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
