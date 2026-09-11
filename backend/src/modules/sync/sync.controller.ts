import { Request, Response, NextFunction } from 'express';
import { processSyncBatch, getSyncStatus, retryFailedEvents } from '../../services/sync.service';
import { sendSuccess } from '../../utils/api-response';

export async function syncEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId, events } = req.body;
    const results = await processSyncBatch(events.map((e: any) => ({
      ...e,
      deviceId,
    })));
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
    sendSuccess(res, { summary, results }, 'Sync completed');
  } catch (err) { next(err); }
}

export async function syncStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const deviceId = req.params.deviceId as string;
    const status = await getSyncStatus(deviceId);
    sendSuccess(res, status);
  } catch (err) { next(err); }
}

export async function retrySync(req: Request, res: Response, next: NextFunction) {
  try {
    const deviceId = req.params.deviceId as string;
    const result = await retryFailedEvents(deviceId);
    sendSuccess(res, result, 'Retry completed');
  } catch (err) { next(err); }
}
