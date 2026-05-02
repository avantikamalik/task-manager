'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/projects.controller');
const { requireAuth } = require('../middleware/require-auth');
const { loadProjectMembership } = require('../middleware/project-access');
const { validateBody } = require('../middleware/validate');

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validateBody(ctrl.createSchema), ctrl.create);

router.get('/:id', loadProjectMembership(), ctrl.getOne);
router.patch('/:id', loadProjectMembership({ requireAdmin: true }), validateBody(ctrl.updateSchema), ctrl.update);
router.delete('/:id', loadProjectMembership({ requireAdmin: true }), ctrl.remove);

// Members
router.get('/:id/members', loadProjectMembership(), ctrl.listMembers);
router.post(
  '/:id/members',
  loadProjectMembership({ requireAdmin: true }),
  validateBody(ctrl.memberSchema),
  ctrl.addMember
);
router.patch(
  '/:id/members/:userId',
  loadProjectMembership({ requireAdmin: true }),
  validateBody(ctrl.memberRoleSchema),
  ctrl.updateMember
);
router.delete('/:id/members/:userId', loadProjectMembership({ requireAdmin: true }), ctrl.removeMember);

module.exports = router;
