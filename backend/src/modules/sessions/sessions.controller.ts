import { Request, Response, NextFunction } from 'express';
import * as service from './sessions.service';
import { sendSuccess, sendPaginated } from '../../utils/api-response';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await service.create({
      patientId: req.body.patientId,
      gameId: req.body.gameId,
      offlineCreated: req.body.offlineCreated,
      offlineEventId: req.body.offlineEventId,
      metadata: req.body.metadata,
    });
    sendSuccess(res, session, 'Session created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function addAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const attempt = await service.addAttempt(
      req.params.id as string,
      {
        questionId: req.body.questionId,
        correct: req.body.correct,
        responseTimeMs: req.body.responseTimeMs,
        difficulty: req.body.difficulty,
        score: req.body.score,
        selectedAnswer: req.body.selectedAnswer,
        offlineEventId: req.body.offlineEventId,
        metadata: req.body.metadata,
      },
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, attempt, 'Attempt recorded successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function endSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await service.endSession(
      req.params.id as string,
      req.body.completionStatus,
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, session, 'Session ended successfully');
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await service.getById(req.params.id as string);
    sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
}

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { sessions, total } = await service.getByPatient(
      req.params.patientId as string,
      page,
      limit,
    );
    sendPaginated(res, sessions, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function addMoodCheckin(req: Request, res: Response, next: NextFunction) {
  try {
    const checkin = await service.addMoodCheckin(
      req.params.patientId as string,
      req.body.mood,
      req.body.notes,
    );
    sendSuccess(res, checkin, 'Mood checkin recorded successfully', 201);
  } catch (err) {
    next(err);
  }
}
