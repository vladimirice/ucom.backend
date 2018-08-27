
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'current_rate', {
      type: Sequelize.DECIMAL(10, 10),
      required: false,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Users', 'current_rate');
  }
};
