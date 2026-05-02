'use strict';

/**
 * MySQL connection builder (Railway / production safe)
 * Uses DATABASE_URL as the single source of truth.
 */

function buildConnection() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url) {
    throw new Error('DATABASE_URL is missing. Please set it in environment variables.');
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch (err) {
    // If URL parsing fails, return raw string (fallback for mysql2)
    return url;
  }

  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace('/', ''),
    charset: 'utf8mb4',
    ssl: { rejectUnauthorized: false }, // required for Railway / cloud DBs
  };
}

module.exports = { buildConnection };
