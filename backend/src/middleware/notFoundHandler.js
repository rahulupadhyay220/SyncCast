import { ApiError } from '../utils/errorResponse.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundHandler;
