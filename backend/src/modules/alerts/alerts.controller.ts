import { Request, Response, NextFunction } from 'express';
import * as service from './alerts.service';
import { sendSuccess, sendPaginated } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const alerts = await service.getByPatient(
      req.params.patientId as string,
      status as any,
    );
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const alert = await service.update(req.params.id as string, req.body);
    sendSuccess(res, alert, 'Alert updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { alerts, total } = await service.getAll(
      {
        status: req.query.status as any,
        type: req.query.type as any,
        severity: req.query.severity as any,
      },
      page,
      limit,
    );
    sendPaginated(res, alerts, total, page, limit);
  } catch (err) {
    next(err);
  }
}
