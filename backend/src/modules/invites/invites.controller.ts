import { Request, Response, NextFunction } from 'express';
import * as service from './invites.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const invites = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, invites);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const invite = await service.create(req.body);
    sendSuccess(res, invite, 'Invite created successfully', 201);
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const invite = await service.updateStatus(req.params.id as string, status);
    sendSuccess(res, invite, 'Invite updated successfully');
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(req.params.id as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
