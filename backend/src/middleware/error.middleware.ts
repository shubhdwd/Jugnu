import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = (req as { id?: string }).id;
  const meta = {
    type: 'error.request',
    requestId,
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  };

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('db.error', {
      ...meta,
      error: { ...meta.error, prismaCode: err.code },
    });
  } else {
    logger.error('error.request', meta);
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof TokenExpiredError) {
    sendError(res, 'Token expired', 401);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid token', 401);
    return;
  }

  sendError(res, 'Internal server error', 500);
};

export default errorHandler;
