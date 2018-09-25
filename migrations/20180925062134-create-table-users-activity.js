const TABLE_NAME = 'users_activity';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      create table ${TABLE_NAME}
      (
        id                serial not null
                          constraint ${TABLE_NAME}_pkey primary key,
                          
        activity_type_id  smallint not null,
        user_id_from      integer not null
                          constraint ${TABLE_NAME}_user_id_from_fkey references "Users",
        entity_id_to      bigint not null,
        entity_name       varchar(255) not null,
        
        signed_transaction  text not null,
        blockchain_response text not null default '',
        blockchain_status   smallint not null default 0,
        
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null
      )`;

    return queryInterface.sequelize.query(sql);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
