'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/tasks.controller');
const { requireAuth } = require('../middleware/require-auth');
const { validateBody } = require('../middleware/validate');

router.use(requireAuth);

router.get('/:taskId', ctrl.loadTask, ctrl.getOne);
router.patch('/:taskId', ctrl.loadTask, validateBody(ctrl.updateSchema), ctrl.update);
router.delete('/:taskId', ctrl.loadTask, ctrl.remove);

module.exports = router;
