const TABLE_NAME = 'users_activity';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN entity_id_on    BIGINT DEFAULT NULL;
      ALTER TABLE ${TABLE_NAME} ADD COLUMN entity_name_on  CHAR(10) DEFAULT NULL;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN entity_id_on;
      ALTER TABLE ${TABLE_NAME} DROP COLUMN entity_name_on;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
