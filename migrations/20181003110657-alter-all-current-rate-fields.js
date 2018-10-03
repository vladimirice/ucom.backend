'use strict';

module.exports = {
  up: (queryInterface) => {

    const tables = [
      'organizations',
      'posts',
      'Users',
    ];

    let promises = [];
    tables.forEach(table => {
      promises.push(queryInterface.sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN current_rate TYPE NUMERIC(20,10);`));
    });

    return Promise.all(promises);
  },

  down: (queryInterface, Sequelize) => {
  }
};
