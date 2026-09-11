import { Request, Response, NextFunction } from 'express';
import * as service from './personalization.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const personalization = await service.getByPatient(req.params.patientId as string);
    sendSuccess(res, personalization);
  } catch (err) {
    next(err);
  }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {
    const personalization = await service.createOrUpdate(req.params.patientId as string, req.body);
    sendSuccess(res, personalization, 'Personalization updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getGameAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const gameId = req.query.gameId as string | undefined;
    const assets = await service.getGameAssets(req.params.patientId as string, gameId);
    sendSuccess(res, assets);
  } catch (err) {
    next(err);
  }
}

export async function getGameAssetById(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await service.getGameAssetById(req.params.assetId as string);
    sendSuccess(res, asset);
  } catch (err) {
    next(err);
  }
}

export async function createGameAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await service.createGameAsset({
      patientId: req.params.patientId as string,
      ...req.body,
    });
    sendSuccess(res, asset, 'Game asset created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateGameAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await service.updateGameAsset(req.params.assetId as string, req.body);
    sendSuccess(res, asset, 'Game asset updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteGameAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.deleteGameAsset(req.params.assetId as string);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
