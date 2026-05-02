'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/require-auth');

router.post('/signup', validateBody(ctrl.signupSchema), ctrl.signup);
router.post('/login', validateBody(ctrl.loginSchema), ctrl.login);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
