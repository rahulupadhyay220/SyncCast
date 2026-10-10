import { ZodError } from 'zod';
import { ApiError } from '../utils/errorResponse.js';

/**
 * Higher-order middleware to validate incoming request data using Zod
 * 
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'params' | 'query'} source 
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ApiError(400, 'Validation failed', issues));
      }
      return next(error);
    }
  };
};

export default validate;
