const TAGS_TABLE_NAME               = 'tags';
const ENTITY_TAGS_TABLE_NAME        = 'entity_tags';
const ENTITY_STATE_LOG_TABLE_NAME   = 'entity_state_log';

const POSTS_TABLE_NAME              = 'posts';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TAGS_TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TAGS_TABLE_NAME}_pkey PRIMARY KEY,
        title                 VARCHAR(2048) NOT NULL UNIQUE,
        first_entity_id       BIGINT NOT NULL,
        first_entity_name     CHAR(10) NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        update_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE ${ENTITY_TAGS_TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${ENTITY_TAGS_TABLE_NAME}_pkey PRIMARY KEY,
        
        tag_id                BIGINT NOT NULL,
        tag_title             VARCHAR(2048) NOT NULL,
        
        user_id               INT NOT NULL,
        org_id                INT DEFAULT NULL,
        
        entity_id             BIGINT NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      
      ALTER TABLE ${ENTITY_TAGS_TABLE_NAME} 
      ADD CONSTRAINT ${ENTITY_TAGS_TABLE_NAME}_tag_id__fk
      FOREIGN KEY (tag_id) REFERENCES "${TAGS_TABLE_NAME}"(id);

      ALTER TABLE ${ENTITY_TAGS_TABLE_NAME} 
      ADD CONSTRAINT ${ENTITY_TAGS_TABLE_NAME}_user_id__fk
      FOREIGN KEY (user_id) REFERENCES "Users"(id);

      ALTER TABLE ${ENTITY_TAGS_TABLE_NAME} 
      ADD CONSTRAINT ${ENTITY_TAGS_TABLE_NAME}_org_id__fk
      FOREIGN KEY (org_id) REFERENCES "organizations"(id);
      
      CREATE TABLE ${ENTITY_STATE_LOG_TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${ENTITY_STATE_LOG_TABLE_NAME}_pkey PRIMARY KEY,
        
        entity_id             BIGINT NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        
        state_json            JSONB NOT NULL,
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      
      ALTER TABLE ${POSTS_TABLE_NAME} ADD COLUMN entity_tags JSONB DEFAULT NULL;
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      DROP TABLE ${ENTITY_TAGS_TABLE_NAME};
      DROP TABLE ${TAGS_TABLE_NAME};
      DROP TABLE ${ENTITY_STATE_LOG_TABLE_NAME};
      
      ALTER TABLE ${POSTS_TABLE_NAME} DROP COLUMN entity_tags;
    `;

    return queryInterface.sequelize.query(sql);
  }
};
