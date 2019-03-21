const TABLE_NAME = 'airdrops_users_external_data';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        users_external_id     BIGINT NOT NULL REFERENCES users_external(id) ON DELETE RESTRICT,
        json_data             JSONB NOT NULL
      );

    CREATE UNIQUE INDEX ${TABLE_NAME}_users_external_id_idx 
      ON ${TABLE_NAME}(users_external_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
