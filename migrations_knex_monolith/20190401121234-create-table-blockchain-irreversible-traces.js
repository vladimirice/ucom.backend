const SCHEMA_NAME = 'blockchain';
const TABLE_NAME = 'irreversible_traces';

const TABLE_NAME_WITH_SCHEMA = `${SCHEMA_NAME}.${TABLE_NAME}`;
const TABLE_NAME_FOR_CONSTRAINTS = `${SCHEMA_NAME}_${TABLE_NAME}`;

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE SCHEMA ${SCHEMA_NAME};
      
      CREATE TABLE ${TABLE_NAME_WITH_SCHEMA}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_pkey PRIMARY KEY,

        block_number          BIGINT NOT NULL,
                              
        tr_type               SMALLINT NOT NULL,
        tr_processed_data     JSONB NOT NULL,
        
        tr_id                 VARCHAR(1024) NOT NULL,
        block_id              VARCHAR(2048) NOT NULL,
        
        account_name_from     VARCHAR(255) DEFAULT NULL,
        account_name_to       VARCHAR(255) DEFAULT NULL,
          
        raw_tr_data           JSONB NOT NULL,
        memo                  VARCHAR(2048) NOT NULL DEFAULT '',
        
        tr_executed_at        TIMESTAMP WITH TIME ZONE NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_block_number 
      CHECK (block_number > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_tr_type 
      CHECK (tr_type > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_tr_id 
      CHECK (char_length(tr_id) > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_block_id
      CHECK (char_length(block_id) > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_account_name_from
      CHECK (account_name_from IS NOT NULL AND char_length(account_name_from) > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_account_name_to
      CHECK (account_name_to IS NOT NULL AND char_length(account_name_to) > 0);


      CREATE UNIQUE INDEX ${TABLE_NAME_FOR_CONSTRAINTS}_tr_parts_unique_idx ON ${TABLE_NAME_WITH_SCHEMA}(block_number, tr_id, block_id);
      
      CREATE INDEX ${TABLE_NAME_FOR_CONSTRAINTS}_accounts_idx ON ${TABLE_NAME_WITH_SCHEMA}(account_name_from, account_name_to);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars,func-names
exports.down = function (knex, Promise) {
};
