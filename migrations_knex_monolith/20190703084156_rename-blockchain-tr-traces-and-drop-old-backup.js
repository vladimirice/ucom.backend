exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
    ALTER TABLE blockchain_tr_traces RENAME TO blockchain_tr_traces_backup;
    DROP TABLE blockchain_tr_traces_rn_2;
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
