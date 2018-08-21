'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    queryInterface.addColumn('Users', 'public_key', {
      type: Sequelize.STRING,
      required: false,
    });

    return queryInterface;
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'public_key');

    return queryInterface;
  }
};
