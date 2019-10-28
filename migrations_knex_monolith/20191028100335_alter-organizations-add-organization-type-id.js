exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE organizations ADD COLUMN organization_type_id SMALLINT NOT NULL DEFAULT 1;
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
