const TABLE_NAME              = 'affiliates.users_activity_referral';
const TABLE_NAME_CONSTRAINTS  = 'affiliates_users_activity_referral';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${TABLE_NAME}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME_CONSTRAINTS}_pkey PRIMARY KEY,
                              
        referral_user_id      INT       NOT NULL REFERENCES "Users"(id),
        source_entity_id      BIGINT    NOT NULL CHECK (source_entity_id > 0),
        entity_name           CHAR(10)  NOT NULL,
        
        conversion_id         BIGINT    NOT NULL REFERENCES "affiliates"."conversions"(id),        
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

    CREATE UNIQUE INDEX ${TABLE_NAME_CONSTRAINTS}_user_id_source_entity_id_entity_name_unique_idx 
      ON ${TABLE_NAME}(referral_user_id, source_entity_id, entity_name);

    CREATE UNIQUE INDEX ${TABLE_NAME_CONSTRAINTS}_conversion_id_unique_idx 
      ON ${TABLE_NAME}(conversion_id);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
