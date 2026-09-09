import { Request, Response, NextFunction } from 'express';
import * as service from './insights.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const insights = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, insights);
  } catch (err) {
    next(err);
  }
}

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const trends = await service.getTrends(req.params.patientId as string);
    sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
}

export async function getAbility(req: Request, res: Response, next: NextFunction) {
  try {
    const ability = await service.getAbility(req.params.patientId as string);
    sendSuccess(res, ability);
  } catch (err) {
    next(err);
  }
}
