const TABLE_NAME = 'users_external';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        external_type_id      SMALLINT        NOT NULL,
        
        external_id           BIGINT          NOT NULL,
        external_login        VARCHAR(1024)   NOT NULL,
        json_value            JSONB           NOT NULL,
        user_id               INT             DEFAULT NULL REFERENCES "Users"(id) ON DELETE RESTRICT        
      );

    CREATE UNIQUE INDEX ${TABLE_NAME}_external_type_id_external_id_idx 
      ON ${TABLE_NAME}(external_type_id, external_id);

    CREATE INDEX ${TABLE_NAME}_user_id_idx ON ${TABLE_NAME}(user_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
