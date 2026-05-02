'use strict';

const { z } = require('zod');
const db = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const { notFound, badRequest, conflict } = require('../utils/http-error');

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160),
  description: z.string().trim().max(2000).optional().nullable(),
});

const updateSchema = createSchema.partial();

const memberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.enum(['admin', 'member']).optional().default('member'),
});

const memberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

const mapProject = (p, role, counts) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  ownerId: p.owner_id,
  myRole: role,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  ...(counts ? { taskCounts: counts } : {}),
});

/** GET /api/projects: list projects the current user belongs to. */
const list = asyncHandler(async (req, res) => {
  const isGlobalAdmin = req.user.global_role === 'admin';

  const projects = isGlobalAdmin
    ? await db('projects').select('*').orderBy('created_at', 'desc')
    : await db('projects as p')
        .join('project_members as pm', 'pm.project_id', 'p.id')
        .where('pm.user_id', req.user.id)
        .select('p.*', 'pm.role as my_role')
        .orderBy('p.created_at', 'desc');

  const ids = projects.map((p) => p.id);
  if (!ids.length) return res.json({ projects: [] });

  // Aggregate task counts per project in a single query
  const today = new Date().toISOString().slice(0, 10);
  const counts = await db('tasks')
    .whereIn('project_id', ids)
    .select('project_id')
    .select(db.raw('COUNT(*) as total'))
    .select(db.raw("SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo"))
    .select(db.raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"))
    .select(db.raw("SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done"))
    .select(
      db.raw(
        "SUM(CASE WHEN status <> 'done' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) as overdue",
        [today]
      )
    )
    .groupBy('project_id');

  const countMap = new Map(
    counts.map((c) => [
      c.project_id,
      {
        total: Number(c.total) || 0,
        todo: Number(c.todo) || 0,
        inProgress: Number(c.in_progress) || 0,
        done: Number(c.done) || 0,
        overdue: Number(c.overdue) || 0,
      },
    ])
  );

  const result = projects.map((p) => {
    const role = isGlobalAdmin ? 'admin' : p.my_role;
    const c = countMap.get(p.id) || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
    return mapProject(p, role, c);
  });

  res.json({ projects: result });
});

/** POST /api/projects: any authenticated user can create. Creator becomes project admin. */
const create = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const projectId = await db.transaction(async (trx) => {
    const [id] = await trx('projects').insert({
      name,
      description: description || null,
      owner_id: req.user.id,
    });
    await trx('project_members').insert({
      project_id: id,
      user_id: req.user.id,
      role: 'admin',
    });
    return id;
  });

  const project = await db('projects').where({ id: projectId }).first();
  res.status(201).json({ project: mapProject(project, 'admin') });
});

/** GET /api/projects/:id: full project details + members. */
const getOne = asyncHandler(async (req, res) => {
  const project = req.project;
  const role = req.projectMembership.role;

  const members = await db('project_members as pm')
    .join('users as u', 'u.id', 'pm.user_id')
    .where('pm.project_id', project.id)
    .select(
      'pm.user_id as id',
      'u.name',
      'u.email',
      'pm.role',
      'pm.joined_at'
    )
    .orderBy('u.name', 'asc');

  res.json({
    project: mapProject(project, role),
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      joinedAt: m.joined_at,
    })),
  });
});

/** PATCH /api/projects/:id: admin only (handled by middleware). */
const update = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.description !== undefined) updates.description = req.body.description || null;

  if (!Object.keys(updates).length) throw badRequest('No fields to update');

  await db('projects').where({ id: req.project.id }).update(updates);
  const project = await db('projects').where({ id: req.project.id }).first();
  res.json({ project: mapProject(project, req.projectMembership.role) });
});

/** DELETE /api/projects/:id: admin only. */
const remove = asyncHandler(async (req, res) => {
  await db('projects').where({ id: req.project.id }).del();
  res.status(204).end();
});

// Members
const listMembers = asyncHandler(async (req, res) => {
  const members = await db('project_members as pm')
    .join('users as u', 'u.id', 'pm.user_id')
    .where('pm.project_id', req.project.id)
    .select('pm.user_id as id', 'u.name', 'u.email', 'pm.role', 'pm.joined_at')
    .orderBy('u.name', 'asc');

  res.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      joinedAt: m.joined_at,
    })),
  });
});

const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw notFound('User not found');

  const existing = await db('project_members')
    .where({ project_id: req.project.id, user_id: userId })
    .first();
  if (existing) throw conflict('User is already a member of this project');

  await db('project_members').insert({
    project_id: req.project.id,
    user_id: userId,
    role,
  });

  res.status(201).json({
    member: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      joinedAt: new Date().toISOString(),
    },
  });
});

const updateMember = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const { role } = req.body;

  if (userId === req.project.owner_id && role !== 'admin') {
    throw badRequest('The project owner must remain an admin');
  }

  const updated = await db('project_members')
    .where({ project_id: req.project.id, user_id: userId })
    .update({ role });

  if (!updated) throw notFound('Member not found');
  res.json({ ok: true });
});

const removeMember = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  if (userId === req.project.owner_id) {
    throw badRequest('Cannot remove the project owner');
  }
  const deleted = await db('project_members')
    .where({ project_id: req.project.id, user_id: userId })
    .del();
  if (!deleted) throw notFound('Member not found');
  res.status(204).end();
});

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  createSchema,
  updateSchema,
  memberSchema,
  memberRoleSchema,
};
