const TABLE_NAME = 'organizations';
const COLUMN_NAME = 'current_rate';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} NUMERIC (10, 10) NOT NULL default 0;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};
