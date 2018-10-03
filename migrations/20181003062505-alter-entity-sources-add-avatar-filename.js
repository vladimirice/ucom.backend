const TABLE_NAME  = 'entity_sources';
const COLUMN_NAME = 'avatar_filename';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} VARCHAR(1024)  
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};
