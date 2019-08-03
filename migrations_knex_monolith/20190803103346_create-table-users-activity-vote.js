const TABLE_NAME = 'users_activity_vote';

exports.up = (knex) => {
  /*


  unique index
   */

  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        entity_id             BIGINT NOT NULL,
        user_id               INT NOT NULL,
        interaction_type      SMALLINT NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );


      ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT fk_${TABLE_NAME}_user_id
        FOREIGN KEY (user_id) 
        REFERENCES "Users"(id);


      CREATE UNIQUE INDEX ${TABLE_NAME}_user_id_entity_id_entity_name_unique_idx 
        ON ${TABLE_NAME}(user_id, entity_id, entity_name);

    ALTER TABLE ${TABLE_NAME} 
      ADD CONSTRAINT ${TABLE_NAME}_check
    CHECK (
        interaction_type in (2, 4)
        AND entity_name IN ('posts     ', 'comments  ')
        AND entity_id > 0
    );
`;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
