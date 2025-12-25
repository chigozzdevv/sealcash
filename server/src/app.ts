import express from 'express';
import { env } from '@config/env';
import { connectDB } from '@config/database';
import { escrowRoutes } from '@api/escrow.routes';
import { authRoutes } from '@api/auth.routes';
import { userRoutes } from '@api/user.routes';

const app = express();

app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/escrow', escrowRoutes);

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`SealCash running on port ${env.PORT}`);
  });
};

start();
