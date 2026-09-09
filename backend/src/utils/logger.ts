import morgan from 'morgan';
import { env } from '../config/env';

export const morganMiddleware = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
);

export const logger = {
  info: (message: string, ...args: unknown[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => {
    if (env.LOG_LEVEL === 'debug') console.log(`[DEBUG] ${message}`, ...args);
  },
};
