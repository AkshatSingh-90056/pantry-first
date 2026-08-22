const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDatabasePool,
  getDatabaseUrl,
  getDatabasePool,
  resetDatabasePool,
} = require('../config/database');

test('getDatabaseUrl returns a trimmed DATABASE_URL', () => {
  assert.equal(
    getDatabaseUrl({ DATABASE_URL: '  postgresql://user:password@localhost:5432/pantry_first  ' }),
    'postgresql://user:password@localhost:5432/pantry_first',
  );
});

test('getDatabaseUrl rejects missing database configuration without revealing credentials', () => {
  assert.throws(
    () => getDatabaseUrl({}),
    (error) => error.code === 'DATABASE_URL_REQUIRED' && error.message === 'DATABASE_URL is required for database access.',
  );
});

test('createDatabasePool configures one pool with the validated connection string', () => {
  let receivedOptions;

  class FakePool {
    constructor(options) {
      receivedOptions = options;
    }
  }

  const pool = createDatabasePool({ DATABASE_URL: 'postgresql://user:password@localhost:5432/pantry_first' }, FakePool);

  assert.ok(pool instanceof FakePool);
  assert.deepEqual(receivedOptions, {
    connectionString: 'postgresql://user:password@localhost:5432/pantry_first',
  });
});

test('getDatabasePool reuses a single pool instance', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/pantry_first';
  resetDatabasePool();

  try {
    assert.equal(getDatabasePool(), getDatabasePool());
  } finally {
    resetDatabasePool();
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }
});
