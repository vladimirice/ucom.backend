const TABLE_NAME = 'users_current_params';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE "${TABLE_NAME}" ADD COLUMN scaled_social_rate_delta NUMERIC(20, 10) NOT NULL DEFAULT 0;
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
