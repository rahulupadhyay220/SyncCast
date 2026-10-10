/**
 * Standard API Success Response Formatter
 * 
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard API Error Response Formatter
 * 
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} error
 * @param {any} details
 */
export const sendError = (res, statusCode = 500, error = 'Internal Server Error', details = null) => {
  const payload = {
    success: false,
    error,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
