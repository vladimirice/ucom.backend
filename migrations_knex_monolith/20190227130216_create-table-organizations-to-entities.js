const TABLE_NAME = 'organizations_to_entities';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE TABLE ${TABLE_NAME}
    (
      id                    BIGSERIAL NOT NULL
                            CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                            
      organization_id       INT       NOT NULL,
      entity_name           CHAR(10)  NOT NULL,  
      entity_id             BIGINT    NOT NULL,
      relation_type         SMALLINT  NOT NULL,  
      
      created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      unique (relation_type, entity_id, entity_name, organization_id)
    );

    ALTER TABLE ${TABLE_NAME}
      ADD CONSTRAINT fk_${TABLE_NAME}_organization_id
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ;
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
