'use strict';

const db = require('../config/db');
const asyncHandler = require('../utils/async-handler');

/**
 * List users. Accessible to any authenticated user. Used by the
 * "assign teammate" / "add member" pickers.
 * Supports `?q=` search by name or email.
 */
const list = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  let query = db('users').select('id', 'name', 'email', 'global_role').orderBy('name', 'asc');
  if (q) {
    query = query.where((b) => b.where('name', 'like', `%${q}%`).orWhere('email', 'like', `%${q}%`));
  }
  const rows = await query.limit(50);
  res.json({
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      globalRole: u.global_role,
    })),
  });
});

module.exports = { list };
