'use strict';

const { verify } = require('../utils/jwt');
const { unauthorized } = require('../utils/http-error');
const db = require('../config/db');

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Missing or invalid Authorization header');
    }

    let payload;
    try {
      payload = verify(token);
    } catch {
      throw unauthorized('Invalid or expired token');
    }

    const user = await db('users')
      .select('id', 'name', 'email', 'global_role')
      .where({ id: payload.sub })
      .first();

    if (!user) throw unauthorized('User no longer exists');
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
