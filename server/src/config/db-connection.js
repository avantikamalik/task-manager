'use strict';

/**
 * Detect whether SSL should be enabled. Some managed DBs (Aiven, PlanetScale,
 * etc.) put `ssl-mode=REQUIRED` in the URL, which is a MySQL CLI flag that the
 * `mysql2` driver does NOT auto-parse. We handle it here.
 */
function detectSsl(urlOrFlag) {
  if (process.env.DB_SSL === 'true') return true;
  if (process.env.DB_SSL === 'false') return false;
  if (typeof urlOrFlag === 'string') {
    const lower = urlOrFlag.toLowerCase();
    if (lower.includes('ssl-mode=required')) return true;
    if (lower.includes('ssl=true')) return true;
    if (lower.includes('aivencloud.com')) return true;
    if (lower.includes('planetscale')) return true;
  }
  return false;
}

/**
 * Build a Knex MySQL connection config from either DATABASE_URL
 * (preferred for Railway / Aiven / PlanetScale style URLs) or individual DB_* env vars.
 */
function buildConnection() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (url) {
    // Strip query params the mysql2 driver does not understand
    // (e.g. ?ssl-mode=REQUIRED) and decide SSL ourselves.
    const useSsl = detectSsl(url);
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      // Fall back to passing the raw string if URL parsing fails.
      return url;
    }

    const conn = {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
      charset: 'utf8mb4',
    };

    if (useSsl) {
      // `rejectUnauthorized: false` accepts the provider's CA chain without
      // requiring the user to download a CA cert. For stricter validation,
      // mount the CA file and set { ca: fs.readFileSync(...) } here.
      conn.ssl = { rejectUnauthorized: false };
    }
    return conn;
  }

  const conn = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'team_task_manager',
    charset: 'utf8mb4',
  };

  if (detectSsl(process.env.DB_HOST)) {
    conn.ssl = { rejectUnauthorized: false };
  }
  return conn;
}

module.exports = { buildConnection };
