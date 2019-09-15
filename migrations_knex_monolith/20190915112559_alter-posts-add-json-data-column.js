exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE posts ADD COLUMN json_data JSONB NOT NULL DEFAULT '{}';
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
