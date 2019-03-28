const TABLE_NAME = 'users_activity_trust';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        user_id               INT NOT NULL REFERENCES "Users"(id),
        entity_id             BIGINT NOT NULL CHECK (entity_id > 0),
        entity_name           CHAR(10) NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

    CREATE UNIQUE INDEX ${TABLE_NAME}_user_id_entity_id_entity_name_unique_idx 
      ON ${TABLE_NAME}(user_id, entity_id, entity_name);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
