import { env } from '../config/env';
import { logger } from '../utils/logger';

const AI_TIMEOUT_MS = 2000;

export async function callAiService<T>(
  path: string,
  body: unknown,
): Promise<T | null> {
  if (!env.AI_SERVICE_ENABLED) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const res = await fetch(`${env.AI_SERVICE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn(`AI service returned ${res.status} on ${path}; using local fallback`);
        return null;
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    logger.warn(`AI service unreachable (${path}): ${(err as Error).message}; using local fallback`);
    return null;
  }
}