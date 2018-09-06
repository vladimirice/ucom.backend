const TABLE_NAME = 'comments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'depth', {
      type: Sequelize.INTEGER,
      required: false,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(TABLE_NAME, 'depth');
  }
};
