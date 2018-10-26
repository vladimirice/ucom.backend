const TABLE_NAME = 'users_activity';
const NEW_COLUMN = 'event_id';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN ${NEW_COLUMN} SMALLINT DEFAULT NULL;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN ${NEW_COLUMN};
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
