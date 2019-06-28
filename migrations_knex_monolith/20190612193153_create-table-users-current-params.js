exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE users_current_params
      (        
        id                          BIGSERIAL NOT NULL
                                    CONSTRAINT users_current_params_pkey PRIMARY KEY,
        
        posts_total_amount_delta    BIGINT NOT NULL DEFAULT 0,
        user_id                     INT NOT NULL UNIQUE,

        created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                              
        scaled_importance_delta     NUMERIC(20, 10)  NOT NULL DEFAULT 0
      );

      ALTER TABLE users_current_params 
        ADD CONSTRAINT fk_users_current_params_user_id
        FOREIGN KEY (user_id) 
        REFERENCES "Users"(id)
      ;
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
