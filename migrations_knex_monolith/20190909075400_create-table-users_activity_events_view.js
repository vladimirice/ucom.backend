const TABLE_NAME = 'users_activity_events_view';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        entity_id             BIGINT NOT NULL,
        user_id               INT DEFAULT NULL,
        entity_name           CHAR(10) NOT NULL,
        json_headers          JSONB NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );


      ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT fk_${TABLE_NAME}_user_id
        FOREIGN KEY (user_id) 
        REFERENCES "Users"(id);

      CREATE INDEX ${TABLE_NAME}_entity_id_entity_name_idx 
        ON ${TABLE_NAME}(entity_id, entity_name);

    ALTER TABLE ${TABLE_NAME} 
      ADD CONSTRAINT ${TABLE_NAME}_check
    CHECK (
            entity_id > 0
            AND char_length(entity_name) > 0
            AND pg_column_size(json_headers) > 0
    );
`;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
