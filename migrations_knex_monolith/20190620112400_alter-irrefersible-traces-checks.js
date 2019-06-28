const SCHEMA_NAME = 'blockchain';
const TABLE_NAME = 'irreversible_traces';

const TABLE_NAME_WITH_SCHEMA = `${SCHEMA_NAME}.${TABLE_NAME}`;
const TABLE_NAME_FOR_CONSTRAINTS = `${SCHEMA_NAME}_${TABLE_NAME}`;

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
        DROP CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_account_name_to,
        ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_account_name_to 
            CHECK (account_name_to IS NULL OR (
              account_name_to IS NOT NULL AND char_length(account_name_to) > 0)
            );
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
