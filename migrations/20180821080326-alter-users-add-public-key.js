'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn('Users', 'public_key', {
      type: Sequelize.STRING,
      required: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'public_key');

    return queryInterface;
  }
};
