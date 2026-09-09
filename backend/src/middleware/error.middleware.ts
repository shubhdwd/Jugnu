import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`${req.method} ${req.path} - ${err.message}`, err.stack);

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
