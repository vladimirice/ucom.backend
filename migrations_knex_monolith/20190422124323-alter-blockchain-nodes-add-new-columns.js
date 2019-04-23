const TABLE_NAME = 'blockchain_nodes';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE "${TABLE_NAME}" ADD COLUMN scaled_importance_amount NUMERIC(20, 10) NOT NULL DEFAULT 0;
    ALTER TABLE "${TABLE_NAME}" ADD COLUMN blockchain_nodes_type    SMALLINT NOT NULL DEFAULT 1;

    ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT ${TABLE_NAME}_scaled_importance_amount_check
    CHECK (scaled_importance_amount >= 0);

    ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT ${TABLE_NAME}_blockchain_nodes_type_check
    CHECK (blockchain_nodes_type > 0);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
