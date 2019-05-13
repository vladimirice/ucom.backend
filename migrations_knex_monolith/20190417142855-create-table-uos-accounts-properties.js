const SCHEMA_NAME = 'blockchain';
const TABLE_NAME = 'uos_accounts_properties';

const TABLE_NAME_WITH_SCHEMA = `${SCHEMA_NAME}.${TABLE_NAME}`;
const TABLE_NAME_FOR_CONSTRAINTS = `${SCHEMA_NAME}_${TABLE_NAME}`;

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE ${TABLE_NAME_WITH_SCHEMA}
      (
        id                            BIGSERIAL NOT NULL
                                      CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_pkey PRIMARY KEY,

        account_name                  VARCHAR(255)    NOT NULL,
        entity_name                   CHAR(10)        NOT NULL,
        entity_id                     BIGINT          NOT NULL,
        
        staked_balance                BIGINT          NOT NULL,
        validity                      NUMERIC(20, 10) NOT NULL,

        importance                    NUMERIC(20, 10) NOT NULL,
        scaled_importance             NUMERIC(20, 10) NOT NULL,

        stake_rate                    NUMERIC(20, 10) NOT NULL,
        scaled_stake_rate             NUMERIC(20, 10) NOT NULL,

        social_rate                   NUMERIC(20, 10) NOT NULL,
        scaled_social_rate            NUMERIC(20, 10) NOT NULL,

        transfer_rate                 NUMERIC(20, 10) NOT NULL,
        scaled_transfer_rate          NUMERIC(20, 10) NOT NULL,

        previous_cumulative_emission  NUMERIC(20, 10) NOT NULL,
        current_emission              NUMERIC(20, 10) NOT NULL,
        current_cumulative_emission   NUMERIC(20, 10) NOT NULL,
        
        created_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_account_name 
      CHECK (char_length(account_name) > 3);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_entity_name
      CHECK (char_length(entity_name) > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_entity_id
      CHECK (entity_id > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_positive_properties
      CHECK (
              staked_balance                    >= 0 
              AND validity                      >= 0 
              AND importance                    >= 0
              AND scaled_importance             >= 0
              AND stake_rate                    >= 0
              AND scaled_stake_rate             >= 0
              AND social_rate                   >= 0
              AND scaled_social_rate            >= 0
      
              AND transfer_rate                 >= 0
              AND scaled_transfer_rate          >= 0
      
              AND previous_cumulative_emission  >= 0
              AND current_emission              >= 0
              AND current_cumulative_emission   >= 0
          );

    CREATE UNIQUE INDEX ${TABLE_NAME_FOR_CONSTRAINTS}_account_name_unique_idx 
        ON ${TABLE_NAME_WITH_SCHEMA}(account_name);
    CREATE UNIQUE INDEX ${TABLE_NAME_FOR_CONSTRAINTS}_entity_id_entity_name_unique_idx 
        ON ${TABLE_NAME_WITH_SCHEMA}(entity_id, entity_name);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars,func-names
exports.down = function (knex, Promise) {
};
