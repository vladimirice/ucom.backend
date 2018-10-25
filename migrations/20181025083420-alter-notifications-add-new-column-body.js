const TABLE_NAME = 'entity_notifications';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN json_body JSONB DEFAULT NULL;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN json_body;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
