const test = require('node:test');
const assert = require('node:assert/strict');
const { getDatabaseConfig, getJwtSecret } = require('./config');

test('all environments require a strong JWT secret', () => {
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production' }), /JWT_SECRET/);
  assert.throws(() => getJwtSecret({ NODE_ENV: 'development' }), /JWT_SECRET/);
  assert.throws(
    () => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'too-short' }),
    /32 caracteres/
  );
  assert.equal(
    getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }),
    'a'.repeat(32)
  );
});

test('all environments require explicit database credentials', () => {
  assert.throws(
    () => getDatabaseConfig({ DB_HOST: 'db', DB_USER: 'app', DB_NAME: 'stock' }),
    /DB_PASSWORD/
  );
});

test('database config uses provided credentials without a password fallback', () => {
  const config = getDatabaseConfig({
    NODE_ENV: 'production',
    DB_HOST: 'db',
    DB_USER: 'app',
    DB_PASSWORD: 'provided-secret',
    DB_NAME: 'stock'
  });
  assert.equal(config.password, 'provided-secret');
});
