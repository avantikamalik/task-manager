'use strict';

const { z } = require('zod');
const db = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const { notFound, badRequest, forbidden } = require('../utils/http-error');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional()
  .nullable();

const createSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(STATUSES).optional().default('todo'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  dueDate: dateField,
  assigneeId: z.coerce.number().int().positive().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: dateField,
  assigneeId: z.coerce.number().int().positive().optional().nullable(),
});

const mapTask = (t) => ({
  id: t.id,
  projectId: t.project_id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  dueDate: t.due_date,
  assigneeId: t.assignee_id,
  assigneeName: t.assignee_name || null,
  assigneeEmail: t.assignee_email || null,
  createdBy: t.created_by,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

const taskSelect = (qb) =>
  qb
    .select(
      't.id',
      't.project_id',
      't.title',
      't.description',
      't.status',
      't.priority',
      't.due_date',
      't.assignee_id',
      't.created_by',
      't.created_at',
      't.updated_at',
      'u.name as assignee_name',
      'u.email as assignee_email'
    )
    .leftJoin('users as u', 'u.id', 't.assignee_id');

async function ensureAssigneeIsMember(projectId, assigneeId) {
  if (!assigneeId) return;
  const member = await db('project_members')
    .where({ project_id: projectId, user_id: assigneeId })
    .first();
  if (!member) {
    // Allow assignment to global admins even if they are not explicit members
    const u = await db('users').where({ id: assigneeId }).first();
    if (!u || u.global_role !== 'admin') {
      throw badRequest('Assignee must be a member of the project');
    }
  }
}

/** GET /api/projects/:projectId/tasks */
const listForProject = asyncHandler(async (req, res) => {
  const { status, assigneeId, q } = req.query;
  let query = taskSelect(db('tasks as t')).where('t.project_id', req.project.id);

  if (status && STATUSES.includes(status)) query = query.andWhere('t.status', status);
  if (assigneeId) query = query.andWhere('t.assignee_id', Number(assigneeId));
  if (q) {
    const term = `%${String(q).trim()}%`;
    query = query.andWhere((b) =>
      b.where('t.title', 'like', term).orWhere('t.description', 'like', term)
    );
  }

  const rows = await query.orderBy([
    { column: 't.status', order: 'asc' },
    { column: 't.due_date', order: 'asc' },
    { column: 't.created_at', order: 'desc' },
  ]);

  res.json({ tasks: rows.map(mapTask) });
});

/** POST /api/projects/:projectId/tasks */
const create = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  await ensureAssigneeIsMember(req.project.id, assigneeId);

  const [id] = await db('tasks').insert({
    project_id: req.project.id,
    title,
    description: description || null,
    status,
    priority,
    due_date: dueDate || null,
    assignee_id: assigneeId || null,
    created_by: req.user.id,
  });

  const row = await taskSelect(db('tasks as t')).where('t.id', id).first();
  res.status(201).json({ task: mapTask(row) });
});

/** Common task loader: sets req.task and verifies membership. */
const loadTask = asyncHandler(async (req, _res, next) => {
  const taskId = Number(req.params.taskId || req.params.id);
  if (!Number.isFinite(taskId)) throw badRequest('Invalid task id');

  const task = await db('tasks').where({ id: taskId }).first();
  if (!task) throw notFound('Task not found');

  const isGlobalAdmin = req.user.global_role === 'admin';
  const member = isGlobalAdmin
    ? { role: 'admin' }
    : await db('project_members')
        .where({ project_id: task.project_id, user_id: req.user.id })
        .first();
  if (!member) throw forbidden('You do not have access to this task');

  req.task = task;
  req.projectMembership = { role: member.role };
  next();
});

/** GET /api/tasks/:taskId */
const getOne = asyncHandler(async (req, res) => {
  const row = await taskSelect(db('tasks as t')).where('t.id', req.task.id).first();
  res.json({ task: mapTask(row) });
});

/** PATCH /api/tasks/:taskId
 *  Members may update status / assignee. Only project admins (or task creator)
 *  may modify the rest of the fields or delete.
 */
const update = asyncHandler(async (req, res) => {
  const isAdmin = req.projectMembership.role === 'admin';
  const isCreator = req.task.created_by === req.user.id;
  const isAssignee = req.task.assignee_id === req.user.id;

  const allowedForMember = new Set(['status']);
  if (isAssignee) allowedForMember.add('assigneeId'); // assignee can reassign themselves away

  const updates = {};
  for (const [key, val] of Object.entries(req.body)) {
    if (!isAdmin && !isCreator && !allowedForMember.has(key)) {
      throw forbidden(`You may not change "${key}"`);
    }
    if (key === 'title') updates.title = val;
    else if (key === 'description') updates.description = val || null;
    else if (key === 'status') updates.status = val;
    else if (key === 'priority') updates.priority = val;
    else if (key === 'dueDate') updates.due_date = val || null;
    else if (key === 'assigneeId') updates.assignee_id = val || null;
  }

  if (!Object.keys(updates).length) throw badRequest('No fields to update');
  if (updates.assignee_id) {
    await ensureAssigneeIsMember(req.task.project_id, updates.assignee_id);
  }

  await db('tasks').where({ id: req.task.id }).update(updates);
  const row = await taskSelect(db('tasks as t')).where('t.id', req.task.id).first();
  res.json({ task: mapTask(row) });
});

/** DELETE /api/tasks/:taskId */
const remove = asyncHandler(async (req, res) => {
  const isAdmin = req.projectMembership.role === 'admin';
  const isCreator = req.task.created_by === req.user.id;
  if (!isAdmin && !isCreator) throw forbidden('Only project admins or the creator can delete a task');

  await db('tasks').where({ id: req.task.id }).del();
  res.status(204).end();
});

/** GET /api/dashboard: high-level stats for the current user. */
const dashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isGlobalAdmin = req.user.global_role === 'admin';
  const today = new Date().toISOString().slice(0, 10);

  // Project IDs the user can see
  const projectIds = isGlobalAdmin
    ? (await db('projects').select('id')).map((r) => r.id)
    : (
        await db('project_members').where({ user_id: userId }).select('project_id')
      ).map((r) => r.project_id);

  const counts = projectIds.length
    ? await db('tasks')
        .whereIn('project_id', projectIds)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw("SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo"),
          db.raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
          db.raw("SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done"),
          db.raw(
            "SUM(CASE WHEN status <> 'done' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) as overdue",
            [today]
          )
        )
        .first()
    : { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 };

  const myTasks = projectIds.length
    ? await taskSelect(db('tasks as t'))
        .whereIn('t.project_id', projectIds)
        .andWhere('t.assignee_id', userId)
        .andWhere('t.status', '<>', 'done')
        .orderBy('t.due_date', 'asc')
        .limit(10)
    : [];

  const overdue = projectIds.length
    ? await taskSelect(db('tasks as t'))
        .whereIn('t.project_id', projectIds)
        .andWhere('t.status', '<>', 'done')
        .andWhereNot('t.due_date', null)
        .andWhere('t.due_date', '<', today)
        .orderBy('t.due_date', 'asc')
        .limit(10)
    : [];

  res.json({
    counts: {
      total: Number(counts.total) || 0,
      todo: Number(counts.todo) || 0,
      inProgress: Number(counts.in_progress) || 0,
      done: Number(counts.done) || 0,
      overdue: Number(counts.overdue) || 0,
    },
    projectCount: projectIds.length,
    myOpenTasks: myTasks.map(mapTask),
    overdueTasks: overdue.map(mapTask),
  });
});

module.exports = {
  listForProject,
  create,
  getOne,
  update,
  remove,
  loadTask,
  dashboard,
  createSchema,
  updateSchema,
};
