'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { notFoundHandler, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const projectsRoutes = require('./routes/projects.routes');
const projectTasksRoutes = require('./routes/project-tasks.routes');
const tasksRoutes = require('./routes/tasks.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  const origin = process.env.CLIENT_ORIGIN;
  app.use(
    cors({
      origin: origin ? origin.split(',').map((s) => s.trim()) : true,
      credentials: true,
    })
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts. Try again later.' },
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/projects/:projectId/tasks', projectTasksRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: '1h', index: false }));

    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) =>
      res.json({
        name: 'Team Task Manager API',
        message: "Client build not found. Run 'npm run build:client' to serve the SPA from this server.",
      })
    );
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
