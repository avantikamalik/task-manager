'use strict';

const bcrypt = require('bcryptjs');
const { z } = require('zod');

const db = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const { sign } = require('../utils/jwt');
const { conflict, unauthorized } = require('../utils/http-error');

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(191),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  globalRole: u.global_role,
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await db('users').where({ email }).first();
  if (existing) throw conflict('An account with this email already exists');

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // First user to sign up becomes the global admin if no admin exists yet.
  const adminExists = await db('users').where({ global_role: 'admin' }).first();
  const global_role = adminExists ? 'member' : 'admin';

  const [id] = await db('users').insert({ name, email, password_hash, global_role });
  const user = await db('users').where({ id }).first();
  const token = sign({ sub: user.id, role: user.global_role });

  res.status(201).json({ token, user: sanitize(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db('users').where({ email }).first();
  if (!user) throw unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized('Invalid email or password');

  const token = sign({ sub: user.id, role: user.global_role });
  res.json({ token, user: sanitize(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitize(req.user) });
});

module.exports = { signup, login, me, signupSchema, loginSchema };
