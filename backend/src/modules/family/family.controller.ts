import { Request, Response, NextFunction } from 'express';
import * as familyService from './family.service';
import { sendSuccess } from '../../utils/api-response';

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await familyService.invite(req.body);
    sendSuccess(res, result, 'Family member invited successfully', 201);
  } catch (err) { next(err); }
}

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = req.params.patientId as string;
    const result = await familyService.getByPatient(patientId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await familyService.remove(id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
