'use strict';

/**
 * Validate critical environment variables at startup so the app fails
 * fast instead of silently misbehaving in production.
 */
function validateEnv() {
  const required = ['JWT_SECRET'];
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.MYSQL_URL);
  if (!hasDbUrl) {
    required.push('DB_HOST', 'DB_USER', 'DB_NAME');
  }

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[fatal] Missing required environment variables: ${missing.join(', ')}\n` +
      `        Copy .env.example to .env and fill in the values.\n`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    // eslint-disable-next-line no-console
    console.warn('[warn] JWT_SECRET is shorter than 32 characters. Use a longer secret in production.');
  }
}

module.exports = { validateEnv };
