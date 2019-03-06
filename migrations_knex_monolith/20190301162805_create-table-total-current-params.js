const TABLE_NAME = 'total_current_params';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        event_type            SMALLINT      NOT NULL UNIQUE,
        json_value             JSONB         NOT NULL,
        result_value          NUMERIC(20,10) NOT NULL
      );
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
