import { Request, Response, NextFunction } from 'express';
import * as service from './patients.service';
import { sendSuccess, sendPaginated } from '../../utils/api-response';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await service.create({
      ...req.body,
      caregiverId: req.user!.id,
    });
    sendSuccess(res, patient, 'Patient created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { patients, total } = await service.getAll(
      req.user!.id,
      req.user!.role,
      page,
      limit,
    );
    sendPaginated(res, patients, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await service.getById(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, patient);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await service.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, patient, 'Patient updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.remove(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
