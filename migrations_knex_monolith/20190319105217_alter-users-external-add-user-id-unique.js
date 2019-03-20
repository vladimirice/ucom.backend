const TABLE_NAME = 'users_external';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      DROP INDEX ${TABLE_NAME}_user_id_idx;
      CREATE UNIQUE INDEX ${TABLE_NAME}_user_id_idx ON ${TABLE_NAME}(user_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
