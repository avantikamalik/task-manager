'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { buildConnection } = require('./src/config/db-connection');

/** @type {import('knex').Knex.Config} */
const baseConfig = {
  client: 'mysql2',
  connection: buildConnection(),
  pool: { min: 0, max: 10 },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

module.exports = {
  development: baseConfig,
  production: {
    ...baseConfig,
    pool: { min: 0, max: 20 },
  },
};
