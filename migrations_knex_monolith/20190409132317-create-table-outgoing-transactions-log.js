const SCHEMA_NAME = 'blockchain';
const TABLE_NAME = 'outgoing_transactions_log';

const TABLE_NAME_WITH_SCHEMA = `${SCHEMA_NAME}.${TABLE_NAME}`;
const TABLE_NAME_FOR_CONSTRAINTS = `${SCHEMA_NAME}_${TABLE_NAME}`;

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE ${TABLE_NAME_WITH_SCHEMA}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_pkey PRIMARY KEY,

        tr_id                 VARCHAR(1024) NOT NULL,

        signed_payload        JSONB NOT NULL,
        pushing_response      JSONB NOT NULL,
        
        status                SMALLINT NOT NULL,

        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_tr_id 
      CHECK (char_length(tr_id) > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_status
      CHECK (status > 0);

    CREATE UNIQUE INDEX ${TABLE_NAME_FOR_CONSTRAINTS}_tr_id_unique_idx ON ${TABLE_NAME_WITH_SCHEMA}(tr_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars,func-names
exports.down = function (knex, Promise) {
};
