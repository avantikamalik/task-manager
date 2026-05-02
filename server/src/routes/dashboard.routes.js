'use strict';

const router = require('express').Router();
const { requireAuth } = require('../middleware/require-auth');
const { dashboard } = require('../controllers/tasks.controller');

router.get('/', requireAuth, dashboard);

module.exports = router;
