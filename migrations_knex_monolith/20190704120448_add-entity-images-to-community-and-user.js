const NEW_COLUMN = 'entity_images';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE "Users"         ADD COLUMN ${NEW_COLUMN} JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE "organizations" ADD COLUMN ${NEW_COLUMN} JSONB NOT NULL DEFAULT '{}';
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
