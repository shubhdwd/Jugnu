import { Request, Response, NextFunction } from 'express';
import * as service from './mood-entries.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const entries = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, entries);
  } catch (err) { next(err); }
}

export async function getByPatientAndUser(req: Request, res: Response, next: NextFunction) {
  try {
    const entries = await service.getByPatientAndUser(
      req.params.patientId as string,
      req.params.userId as string,
    );
    sendSuccess(res, entries);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const entry = await service.create(req.body, userId);
    sendSuccess(res, entry, 'Mood entry created successfully', 201);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(req.params.id as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
