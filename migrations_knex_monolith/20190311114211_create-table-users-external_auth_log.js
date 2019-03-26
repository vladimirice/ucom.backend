const TABLE_NAME = 'users_external_auth_log';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        json_headers          JSONB           NOT NULL,
        json_body             JSONB           NOT NULL,
        json_value            JSONB           NOT NULL,
        
        referer               VARCHAR(10240)  NOT NULL,
        users_external_id     BIGINT          NOT NULL REFERENCES users_external(id) ON DELETE RESTRICT        
      );

    CREATE INDEX ${TABLE_NAME}_users_external_id_idx ON ${TABLE_NAME}(users_external_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
