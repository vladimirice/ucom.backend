
const TABLE_NAME = 'entity_event_param';

exports.up = (knex) => {
  const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
        entity_id             BIGINT        NOT NULL,
        entity_name           CHAR(10)      NOT NULL,
        entity_blockchain_id  VARCHAR(255)  NOT NULL,
        event_type            SMALLINT      NOT NULL,
        event_group           SMALLINT      NOT NULL,
        event_super_group     SMALLINT      NOT NULL,
        json_value            JSONB         NOT NULL,      
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
