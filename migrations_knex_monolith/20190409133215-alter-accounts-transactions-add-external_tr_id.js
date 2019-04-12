const TABLE_NAME = 'accounts_transactions';
const NEW_COLUMN = 'external_tr_id';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE "${TABLE_NAME}" ADD COLUMN ${NEW_COLUMN} BIGINT DEFAULT NULL;

    ALTER TABLE ${TABLE_NAME} ADD CONSTRAINT ${TABLE_NAME}_${NEW_COLUMN}_fk 
    FOREIGN KEY (${NEW_COLUMN}) REFERENCES blockchain.outgoing_transactions_log (id);

    CREATE UNIQUE INDEX ${TABLE_NAME}_${NEW_COLUMN}_unique_idx ON ${TABLE_NAME}(${NEW_COLUMN});
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
