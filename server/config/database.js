const { Pool } = require('pg');

function getDatabaseUrl(environment = process.env) {
  const databaseUrl = environment.DATABASE_URL;

  if (typeof databaseUrl !== 'string' || !databaseUrl.trim()) {
    const error = new Error('DATABASE_URL is required for database access.');
    error.code = 'DATABASE_URL_REQUIRED';
    throw error;
  }

  return databaseUrl.trim();
}

function createDatabasePool(environment = process.env, PoolConstructor = Pool) {
  return new PoolConstructor({
    connectionString: getDatabaseUrl(environment),
  });
}

let sharedPool;

function getDatabasePool() {
  if (!sharedPool) {
    sharedPool = createDatabasePool();
  }

  return sharedPool;
}

function resetDatabasePool() {
  sharedPool = undefined;
}

module.exports = {
  createDatabasePool,
  getDatabasePool,
  getDatabaseUrl,
  resetDatabasePool,
};
