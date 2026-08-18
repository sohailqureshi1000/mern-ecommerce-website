import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('Set MONGO_URI and JWT_SECRET in server/.env');
    process.exit(1);
  }

  await connectDb(process.env.MONGO_URI);
  app.listen(port, () => {
    console.log(`SOHAIL API listening on ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
