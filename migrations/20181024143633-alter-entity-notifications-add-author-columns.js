const TABLE_NAME = 'entity_notifications';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN user_id_from INTEGER DEFAULT NULL;
      
      ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT fk_user_id_from
        FOREIGN KEY (user_id_from) 
        REFERENCES "Users"(id);
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN user_id_from;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
