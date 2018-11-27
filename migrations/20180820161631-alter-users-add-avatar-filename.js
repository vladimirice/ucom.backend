'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn('Users', 'avatar_filename', {
      type: Sequelize.STRING,
      required: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'avatar_filename');

    return queryInterface;
  }
};
