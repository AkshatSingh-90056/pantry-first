const test = require('node:test');
const assert = require('node:assert/strict');
const migration = require('../migrations/1787399553097_create_users.cjs');

function createMigrationRecorder() {
  const operations = [];

  return {
    operations,
    createExtension: (...args) => operations.push(['createExtension', ...args]),
    createTable: (...args) => operations.push(['createTable', ...args]),
    dropTable: (...args) => operations.push(['dropTable', ...args]),
    func: (value) => ({ function: value }),
    sql: (...args) => operations.push(['sql', ...args]),
  };
}

test('users migration creates the required users schema and normalized-email unique index', () => {
  const pgm = createMigrationRecorder();

  migration.up(pgm);

  assert.deepEqual(pgm.operations[0], ['createExtension', 'pgcrypto', { ifNotExists: true }]);
  const [, tableName, columns] = pgm.operations.find(([operation]) => operation === 'createTable');
  assert.equal(tableName, 'users');
  assert.deepEqual(columns.id, {
    type: 'uuid',
    primaryKey: true,
    default: { function: 'gen_random_uuid()' },
  });
  assert.deepEqual(columns.email, { type: 'varchar(320)', notNull: true });
  assert.deepEqual(columns.password_hash, { type: 'text', notNull: true });
  assert.deepEqual(columns.token_version, { type: 'integer', notNull: true, default: 0 });
  assert.deepEqual(columns.created_at, { type: 'timestamptz', notNull: true, default: { function: 'now()' } });
  assert.deepEqual(columns.updated_at, { type: 'timestamptz', notNull: true, default: { function: 'now()' } });
  assert.deepEqual(
    pgm.operations.find(([operation]) => operation === 'sql'),
    ['sql', 'CREATE UNIQUE INDEX users_email_normalized_unique ON users (lower(email));'],
  );
});

test('users migration down removes the users table and its dependent index', () => {
  const pgm = createMigrationRecorder();

  migration.down(pgm);

  assert.deepEqual(pgm.operations, [['dropTable', 'users', { ifExists: true, cascade: true }]]);
});
