const TABLE_NAME = 'organizations';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'blockchain_id', {
      type: Sequelize.STRING,
      required: false,
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, 'blockchain_id');
  }
};
