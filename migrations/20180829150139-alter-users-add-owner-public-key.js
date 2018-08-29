const TABLE_NAME = 'Users';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'owner_public_key', {
      type: Sequelize.STRING,
      required: false,
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, 'owner_public_key');
  }
};
