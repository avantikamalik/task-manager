'use strict';

const db = require('../config/db');
const { forbidden, notFound, badRequest } = require('../utils/http-error');

/**
 * Resolve the current user's role within a project.
 * Loads `req.project` and `req.projectMembership` ({ role }) for downstream handlers.
 *
 * - Global admins are treated as project admins everywhere.
 * - Non-members of a non-public project receive 403.
 */
function loadProjectMembership({ requireAdmin = false } = {}) {
  return async (req, _res, next) => {
    try {
      const projectId = Number(req.params.projectId || req.params.id);
      if (!Number.isFinite(projectId) || projectId <= 0) {
        throw badRequest('Invalid project id');
      }

      const project = await db('projects').where({ id: projectId }).first();
      if (!project) throw notFound('Project not found');

      let role = null;
      if (req.user.global_role === 'admin') {
        role = 'admin';
      } else {
        const member = await db('project_members')
          .where({ project_id: projectId, user_id: req.user.id })
          .first();
        if (!member) throw forbidden('You are not a member of this project');
        role = member.role;
      }

      if (requireAdmin && role !== 'admin') {
        throw forbidden('Admin permission required');
      }

      req.project = project;
      req.projectMembership = { role };
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { loadProjectMembership };
