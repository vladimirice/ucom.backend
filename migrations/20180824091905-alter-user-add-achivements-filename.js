
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'achievements_filename', {
      type: Sequelize.STRING,
      required: false,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Users', 'achievements_filename');
  }
};
