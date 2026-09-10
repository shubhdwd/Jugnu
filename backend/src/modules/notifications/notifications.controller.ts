import { Request, Response, NextFunction } from 'express';
import * as service from './notifications.service';
import { sendSuccess } from '../../utils/api-response';

export async function getByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await service.getByUser(req.user!.id, unreadOnly);
    sendSuccess(res, notifications);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await service.getById(req.params.id as string);
    sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await service.create(req.body);
    sendSuccess(res, notification, 'Notification created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await service.markRead(req.params.id as string);
    sendSuccess(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markAllRead(req.user!.id);
    sendSuccess(res, result);
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
