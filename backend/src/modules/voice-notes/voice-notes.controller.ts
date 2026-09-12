import { Request, Response, NextFunction } from 'express';
import * as service from './voice-notes.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPerson(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = await service.getByPerson(req.params.personId as string);
    sendSuccess(res, notes);
  } catch (err) { next(err); }
}

export async function getByMemory(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = await service.getByMemory(req.params.memoryId as string);
    sendSuccess(res, notes);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const note = await service.create(req.body, userId);
    sendSuccess(res, note, 'Voice note created successfully', 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await service.update(req.params.id as string, req.body);
    sendSuccess(res, note, 'Voice note updated successfully');
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(req.params.id as string);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
