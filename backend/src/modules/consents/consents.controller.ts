import { Request, Response, NextFunction } from 'express';
import * as service from './consents.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const consents = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, consents);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const consent = await service.getById(req.params.id as string);
    sendSuccess(res, consent);
  } catch (err) {
    next(err);
  }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {
    const consent = await service.upsert({
      patientId: req.params.patientId as string,
      ...req.body,
      grantedBy: req.user!.id,
    });
    sendSuccess(res, consent, 'Consent saved successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const consent = await service.update(req.params.id as string, {
      ...req.body,
      grantedBy: req.user!.id,
    });
    const action = consent.granted ? 'granted' : 'revoked';
    sendSuccess(res, consent, `Consent ${action} successfully`);
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
