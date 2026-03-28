import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import goalsRouter from './routes/goals';
import habitsRouter from './routes/habits';
import journalRouter from './routes/journal';
import moodRouter from './routes/mood';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.CLIENT_URL ?? '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood', moodRouter);

app.listen(PORT, () => {
  console.log(`Sprout API running on http://localhost:${PORT}`);
});
