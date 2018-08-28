const TABLE_NAME = 'posts';


module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(TABLE_NAME, 'current_rate', {
      type: Sequelize.DECIMAL(10, 10),
      required: false,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
