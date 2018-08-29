const TABLE_NAME = 'Users';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'private_key', {
      type: Sequelize.STRING,
      required: false,
      allowNull: true
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'blockchain_registration_status', {
        type: Sequelize.STRING,
        required: false,
        allowNull: true,
        defaultValue: 0
      });
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, 'private_key')
      .then(() => {
        return queryInterface.removeColumn(TABLE_NAME, 'blockchain_registration_status')
      });
  }
};
