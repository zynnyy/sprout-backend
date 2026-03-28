import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import goalsRouter from './routes/goals';
import habitsRouter from './routes/habits';
import journalRouter from './routes/journal';
import moodRouter from './routes/mood';
import aiRouter from './routes/ai';
import subscriptionRouter from './routes/subscription';

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length
    ? (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl) or matching origins
        if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: ${origin} not allowed`));
        }
      }
    : '*',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood', moodRouter);
app.use('/api/ai', aiRouter);
app.use('/api/subscription', subscriptionRouter);

app.listen(PORT, () => {
  console.log(`Sprout API running on http://localhost:${PORT}`);
});
