const TABLE_NAME = 'post_users_team';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'post_id', {
          type: Sequelize.INTEGER,
          required: true,
          references: { model: 'posts', key: 'id' }
        }
      );
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'user_id', {
          type: Sequelize.INTEGER,
          required: true,
          references: { model: 'Users', key: 'id' }
        }
      );
    }).catch((err) => {
      throw new Error(err);
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
