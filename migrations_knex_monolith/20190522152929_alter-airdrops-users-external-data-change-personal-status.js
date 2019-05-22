exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE airdrops_users_external_data ALTER COLUMN personal_statuses SET DEFAULT '{10}';

      UPDATE airdrops_users_external_data SET personal_statuses = '{10}' WHERE 1=1;
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
