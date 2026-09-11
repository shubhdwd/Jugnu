import { Request, Response, NextFunction } from 'express';
import * as service from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/api-response';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { users, total } = await service.getAll(page, limit);
    sendPaginated(res, users, total, page, limit);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await service.getById(req.params.id as string);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}