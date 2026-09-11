import { Request, Response, NextFunction } from 'express';
import * as healthWorkersService from './health-workers.service';
import { sendSuccess } from '../../utils/api-response';

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await healthWorkersService.getMyProfile(req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await healthWorkersService.getPatients(req.user!.id, page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getPriorityList(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await healthWorkersService.getPriorityList(req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getVisitPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await healthWorkersService.getVisitPlan(req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
