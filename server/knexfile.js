'use strict';

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('knex').Knex.Config} */
const config = {
  client: 'mysql2',

  connection: isProduction
    ? process.env.DATABASE_URL
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },

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
  development: config,
  production: config,
};
