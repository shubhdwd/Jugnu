import { sendSuccess, sendError, sendPaginated } from '../src/utils/api-response';
import { AppError, BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from '../src/utils/errors';

describe('Error classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create BadRequestError', () => {
    const error = new BadRequestError('Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
  });

  it('should create UnauthorizedError', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });

  it('should create ForbiddenError', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden');
  });
});

describe('API Response', () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('sendSuccess should send correct response', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 }, 'Success', 200);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
      message: 'Success',
    });
  });

  it('sendSuccess should send without message', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
    });
  });

  it('sendError should send error response', () => {
    const res = mockRes();
    sendError(res, 'Not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
    });
  });

  it('sendPaginated should include pagination', () => {
    const res = mockRes();
    sendPaginated(res, [{ id: 1 }], 50, 2, 10);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1 }],
      pagination: {
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      },
    });
  });
});
