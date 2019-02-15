exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE posts_current_params
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT posts_current_params_pkey PRIMARY KEY,
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                              
        post_id               INT             NOT NULL,
        
        importance_delta      NUMERIC(20,10)  NOT NULL DEFAULT 0,
        activity_index_delta  NUMERIC(20,10)  NOT NULL DEFAULT 0,
        upvotes_delta         BIGINT          NOT NULL DEFAULT 0
      );

      ALTER TABLE posts_current_params 
        ADD CONSTRAINT fk_posts_current_params_post_id
        FOREIGN KEY (post_id) 
        REFERENCES posts(id)
      ;

      CREATE TABLE organizations_current_params
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT organizations_current_params_pkey PRIMARY KEY,
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                              
        organization_id           INT             NOT NULL,
        
        importance_delta          NUMERIC(20,10)  NOT NULL DEFAULT 0,
        activity_index_delta      NUMERIC(20,10)  NOT NULL DEFAULT 0,
        posts_total_amount_delta  BIGINT          NOT NULL DEFAULT 0
      );

      ALTER TABLE organizations_current_params 
        ADD CONSTRAINT fk_organizations_current_params_organization_id
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id)
      ;

      CREATE TABLE tags_current_params
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT tags_current_params_pkey PRIMARY KEY,
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                              
        tag_id                    BIGINT          NOT NULL,
        
        importance_delta          NUMERIC(20,10)  NOT NULL DEFAULT 0,
        activity_index_delta      NUMERIC(20,10)  NOT NULL DEFAULT 0,
        posts_total_amount_delta  BIGINT          NOT NULL DEFAULT 0
      );

      ALTER TABLE tags_current_params
        ADD CONSTRAINT fk_tags_current_params_tag_id
        FOREIGN KEY (tag_id) 
        REFERENCES tags(id)
      ;
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
