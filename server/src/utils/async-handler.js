'use strict';

/** Wrap async route handlers so thrown errors hit Express error middleware. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
