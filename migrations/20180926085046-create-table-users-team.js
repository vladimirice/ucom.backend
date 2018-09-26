const TABLE_NAME = 'users_team';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      create table ${TABLE_NAME}
      (
        id                serial not null
                          constraint ${TABLE_NAME}_pkey primary key,
                          
        user_id           integer not null
                          constraint ${TABLE_NAME}_user_id_fkey references "Users",
        entity_id         bigint not null,
        entity_name       char(10) not null,
        
        status            SMALLINT NOT NULL default 0,
        
        created_at        timestamp with time zone default now() not null,
        updated_at        timestamp with time zone default now() not null
      )`;

    return queryInterface.sequelize.query(sql);
  },
  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
