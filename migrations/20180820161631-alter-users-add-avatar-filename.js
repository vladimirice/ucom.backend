'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    queryInterface.addColumn('Users', 'avatar_filename', {
      type: Sequelize.STRING,
      required: false,
    });

    return queryInterface;
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'avatar_filename');

    return queryInterface;
  }
};
