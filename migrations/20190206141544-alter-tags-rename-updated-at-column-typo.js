'use strict';

const TABLE_NAME = 'tags';

module.exports = {
  up: (queryInterface, Sequelize) => {

    const sql = `
      ALTER TABLE ${TABLE_NAME} 
      RENAME COLUMN update_at TO updated_at;    
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface, Sequelize) => {}
};
