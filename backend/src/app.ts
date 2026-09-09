import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { morganMiddleware, logger } from './utils/logger';
import errorHandler from './middleware/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import patientRoutes from './modules/patients/patients.routes';
import gameRoutes from './modules/games/games.routes';
import sessionRoutes from './modules/sessions/sessions.routes';
import personalizationRoutes from './modules/personalization/personalization.routes';
import reminderRoutes, { reminderRouter } from './modules/reminders/reminders.routes';
import insightRoutes from './modules/insights/insights.routes';
import alertRoutes, { adminAlertRouter } from './modules/alerts/alerts.routes';
import familyRoutes from './modules/family/family.routes';
import healthWorkerRoutes from './modules/health-workers/health-workers.routes';
import syncRoutes from './modules/sync/sync.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morganMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'jugnu-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/patients', personalizationRoutes);
app.use('/api/patients', reminderRouter);
app.use('/api/patients', insightRoutes);
app.use('/api/patients', alertRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/alerts', adminAlertRouter);
app.use('/api/family', familyRoutes);
app.use('/api/health-workers', healthWorkerRoutes);
app.use('/api/sync', syncRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export default app;
