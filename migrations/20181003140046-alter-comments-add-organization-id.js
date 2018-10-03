const TABLE_NAME = 'comments';
const COLUMN_NAME = 'organization_id';

module.exports = {
  up: (queryInterface) => {

    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} INTEGER 
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};
