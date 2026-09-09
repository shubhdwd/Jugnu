import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const typeName = (schema as any)._def?.typeName;
      const isQuery = typeName === 'ZodObject' && (schema as any).description === 'query';

      /* Route schemas wrap the request body under a `body` key (e.g. z.object({ body: z.object({ ... }) })).
         Detect this pattern and validate the real payload against the inner `body` schema, so controllers
         receive the parsed fields directly (e.g. req.body.identifier). The raw HTTP body carries no wrapper. */
      const shape = typeName === 'ZodObject' ? (schema as any)._def?.shape : undefined;
      const shapeMap = typeof shape === 'function' ? shape() : shape;
      const innerBody: ZodSchema | undefined = shapeMap?.body;
      const hasBodyWrapper =
        innerBody && (innerBody as any)._def?.typeName === 'ZodObject';

      const parsed = isQuery
        ? schema.parse(req.query)
        : hasBodyWrapper
          ? innerBody!.parse(req.body)
          : schema.parse(req.body);

      if (isQuery) {
        req.query = parsed;
      } else {
        req.body = parsed;
      }

      next();
    } catch (error: any) {
      const message = error.errors
        ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : error.message;
      next(new BadRequestError(message));
    }
  };
};
