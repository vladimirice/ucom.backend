const TABLE_NAME = 'entity_sources';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      create table ${TABLE_NAME}
      (
        id                serial not null
                          constraint ${TABLE_NAME}_pkey primary key,
        
        source_url        varchar(2048) NOT NULL,
        is_official       boolean NOT NULL DEFAULT false,
        source_type_id    SMALLINT NULL,
        source_group_id   SMALLINT NOT NULL,
        
        entity_id         bigint not null,
        entity_name       char(10) not null,
        
        source_entity_id    BIGINT NULL,
        source_entity_name  char(10) NULL,
        
        text_data         TEXT NOT NULL DEFAULT '',
        
        created_at        timestamp with time zone default now() not null,
        updated_at        timestamp with time zone default now() not null
      );
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
