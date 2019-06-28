const TABLE_NAME = 'airdrops_users_external_data';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE "${TABLE_NAME}" ADD COLUMN are_conditions_fulfilled BOOLEAN NOT NULL DEFAULT FALSE;
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
