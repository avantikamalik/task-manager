'use strict';

const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/tasks.controller');
const { requireAuth } = require('../middleware/require-auth');
const { loadProjectMembership } = require('../middleware/project-access');
const { validateBody } = require('../middleware/validate');

// Mounted at: /api/projects/:projectId/tasks
router.use(requireAuth, loadProjectMembership());

router.get('/', ctrl.listForProject);
router.post('/', validateBody(ctrl.createSchema), ctrl.create);

module.exports = router;
