import { Request, Response, NextFunction } from 'express';
import * as memoriesService from './memories.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = req.params.patientId as string;
    const status = req.query.status as string | undefined;
    const memories = await memoriesService.getByPatient(patientId, status);
    sendSuccess(res, memories);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const memory = await memoriesService.getById(id);
    sendSuccess(res, memory);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const memory = await memoriesService.create(req.body, userId);
    sendSuccess(res, memory, 'Memory created', 201);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const memory = await memoriesService.update(id, req.body);
    sendSuccess(res, memory);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await memoriesService.remove(id);
    sendSuccess(res, { message: 'Memory deleted' });
  } catch (err) { next(err); }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const memory = await memoriesService.approve(id);
    sendSuccess(res, memory);
  } catch (err) { next(err); }
}

export async function decline(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const memory = await memoriesService.decline(id);
    sendSuccess(res, memory);
  } catch (err) { next(err); }
}
