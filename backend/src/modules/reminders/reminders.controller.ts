import { Request, Response, NextFunction } from 'express';
import * as service from './reminders.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.active === 'true';
    const reminders = await service.getByPatient(req.params.patientId as string, activeOnly);
    sendSuccess(res, reminders);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const reminder = await service.create({
      patientId: req.params.patientId as string,
      ...req.body,
    });
    sendSuccess(res, reminder, 'Reminder created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const reminder = await service.update(req.params.id as string, req.body);
    sendSuccess(res, reminder, 'Reminder updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(req.params.id as string);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
