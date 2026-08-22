const USERS_EMAIL_NORMALIZED_UNIQUE_INDEX = 'users_email_normalized_unique';

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(320)',
      notNull: true,
    },
    password_hash: {
      type: 'text',
      notNull: true,
    },
    token_version: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.sql(`CREATE UNIQUE INDEX ${USERS_EMAIL_NORMALIZED_UNIQUE_INDEX} ON users (lower(email));`);
};

exports.down = (pgm) => {
  pgm.dropTable('users', { ifExists: true, cascade: true });
};
