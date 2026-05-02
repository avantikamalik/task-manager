'use strict';

const { badRequest } = require('../utils/http-error');

/**
 * Build an Express middleware that validates `req.body` against a Zod schema.
 * On success, replaces `req.body` with the parsed (typed/coerced) data.
 */
function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Validation failed', details));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validateBody };
