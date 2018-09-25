const TABLE_NAME = 'users_activity';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'activity_group_id', {
      type: Sequelize.SMALLINT,
      required: true,
      allowNull: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, 'activity_group_id');
  }
};
