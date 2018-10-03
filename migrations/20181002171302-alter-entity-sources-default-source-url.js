const TABLE_NAME = 'entity_sources';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ALTER COLUMN source_url SET DEFAULT '';
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface, Sequelize) => {
  }
};
