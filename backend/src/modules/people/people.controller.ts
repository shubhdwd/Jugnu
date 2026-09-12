import { Request, Response, NextFunction } from 'express';
import * as service from './people.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const people = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, people);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const person = await service.create(req.body);
    sendSuccess(res, person, 'Person created successfully', 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const person = await service.update(req.params.id as string, req.body);
    sendSuccess(res, person, 'Person updated successfully');
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(req.params.id as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
