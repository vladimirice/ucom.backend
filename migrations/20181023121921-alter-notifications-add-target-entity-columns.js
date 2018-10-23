const TABLE_NAME = 'entity_notifications';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN target_entity_id    BIGINT DEFAULT NULL;
      ALTER TABLE ${TABLE_NAME} ADD COLUMN target_entity_name  CHAR(10) DEFAULT NULL;
      ALTER TABLE ${TABLE_NAME} ADD COLUMN users_activity_id   INTEGER DEFAULT NULL;
      
      ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT fk_users_activity_id
        FOREIGN KEY (users_activity_id) 
        REFERENCES users_activity(id);
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN target_entity_id;
      ALTER TABLE ${TABLE_NAME} DROP COLUMN target_entity_name;
      ALTER TABLE ${TABLE_NAME} DROP COLUMN users_activity_id;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
