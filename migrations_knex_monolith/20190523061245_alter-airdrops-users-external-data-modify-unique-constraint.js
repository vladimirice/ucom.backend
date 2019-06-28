exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      DROP INDEX airdrops_users_external_data_users_external_id_idx;

      CREATE UNIQUE INDEX airdrops_users_external_data_users_airdrop_id_external_id_unique_idx 
          ON airdrops_users_external_data(airdrop_id, users_external_id);
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
