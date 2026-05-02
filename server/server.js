'use strict';

const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { validateEnv } = require('./src/config/env');
validateEnv();

const { createApp } = require('./src/app');
const db = require('./src/config/db');

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Team Task Manager API listening on http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    db.destroy().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledRejection]', reason);
});
