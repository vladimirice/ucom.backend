'use strict';

const TABLE_NAME = 'posts';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ALTER COLUMN entity_name_for SET NOT NULL;
      ALTER TABLE ${TABLE_NAME} ALTER COLUMN entity_id_for SET NOT NULL;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface, Sequelize) => {}
};
