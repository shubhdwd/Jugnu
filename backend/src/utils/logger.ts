import {
  Request,
  Response,
  NextFunction,
} from 'express';
import { env } from '../config/env';

const SERVICE = 'jugnu-backend';
const SLOW_REQUEST_MS = 2000;

type Meta = Record<string, unknown>;

function normalize(meta?: unknown): Meta {
  if (meta === undefined || meta === null) return {};
  if (meta instanceof Error) {
    return {
      error: {
        name: meta.name,
        message: meta.message,
        stack: meta.stack,
      },
    };
  }
  if (typeof meta === 'string') return { detail: meta };
  if (typeof meta === 'object') return meta as Meta;
  return { detail: String(meta) };
}

function write(level: string, message: string, meta?: unknown): void {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    service: SERVICE,
    message,
    ...normalize(meta),
  });

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
  debug: (message: string, meta?: unknown) => {
    if (env.LOG_LEVEL === 'debug') write('debug', message, meta);
  },
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || (req as { id?: string }).id || 'unknown';
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const responseTimeMs = Number(process.hrtime.bigint() - start) / 1e6;
    const entry = {
      type: 'http',
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: Math.round(responseTimeMs * 100) / 100,
      remoteAddr: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error('http_request', entry);
    } else if (res.statusCode >= 400 || responseTimeMs > SLOW_REQUEST_MS) {
      logger.warn('http_request', entry);
    } else {
      logger.info('http_request', entry);
    }
  });

  next();
}