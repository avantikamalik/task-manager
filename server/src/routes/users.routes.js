'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/require-auth');

router.get('/', requireAuth, ctrl.list);

module.exports = router;
