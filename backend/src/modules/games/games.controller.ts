import { Request, Response, NextFunction } from 'express';
import * as service from './games.service';
import { sendSuccess, sendPaginated } from '../../utils/api-response';
import { GameType, GameCategory, PersonalizationLevel } from '@prisma/client';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters: {
      type?: GameType;
      category?: GameCategory;
      personalizationLevel?: PersonalizationLevel;
      language?: string;
      active?: boolean;
    } = {};

    if (req.query.type) filters.type = req.query.type as GameType;
    if (req.query.category) filters.category = req.query.category as GameCategory;
    if (req.query.personalizationLevel) filters.personalizationLevel = req.query.personalizationLevel as PersonalizationLevel;
    if (req.query.language) filters.language = req.query.language as string;
    if (req.query.active !== undefined) filters.active = req.query.active === 'true';

    const { games, total } = await service.getAll(filters, page, limit);
    sendPaginated(res, games, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const game = await service.getById(req.params.id as string);
    sendSuccess(res, game);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const game = await service.getBySlug(req.params.slug as string);
    sendSuccess(res, game);
  } catch (err) {
    next(err);
  }
}

export async function getRecommended(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getRecommended(
      req.params.patientId as string,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
