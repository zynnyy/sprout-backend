import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SK!);

const PRICES = {
  monthly: 'price_1TBKqlJqYvE2nI4HHKUzA1Fx',
  yearly: 'price_1TBKreJqYvE2nI4HsrcgpwbA',
  lifetime: 'price_1TBKs1JqYvE2nI4HaY1OnG9x',
};

const WEB_URL = process.env.WEB_URL ?? 'https://sprout-backend-production-1342.up.railway.app';

// POST /api/stripe/checkout — create a Stripe Checkout session
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  const { plan } = req.body as { plan: 'monthly' | 'yearly' | 'lifetime' };
  const userId = (req as any).userId;

  const priceId = PRICES[plan];
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const isLifetime = plan === 'lifetime';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isLifetime ? 'payment' : 'subscription',
    success_url: `${WEB_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEB_URL}/`,
    metadata: { userId: user.id, plan },
  });

  res.json({ url: session.url });
});

// POST /api/stripe/portal — customer portal to manage/cancel subscription
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'No Stripe subscription found' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${WEB_URL}/`,
  });

  res.json({ url: session.url });
});

// POST /api/stripe/webhook — Stripe sends events here
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const getCustomerId = (obj: any): string | undefined =>
    obj?.customer ?? obj?.object?.customer;

  const setProByCustomer = async (customerId: string, isPro: boolean) => {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { isPro },
    });
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { isPro: true } });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const active = sub.status === 'active' || sub.status === 'trialing';
      await setProByCustomer(sub.customer as string, active);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await setProByCustomer(sub.customer as string, false);
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.customer) await setProByCustomer(inv.customer as string, false);
      break;
    }
  }

  res.json({ received: true });
});

export default router;
