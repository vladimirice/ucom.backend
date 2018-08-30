const TABLE_NAME = 'post_offer';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      action_button_title: {
        type: Sequelize.STRING,
      },
      action_button_url: {
        type: Sequelize.STRING
      },
      action_duration_in_days: {
        type: Sequelize.INTEGER,
      },
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'post_id', {
          type: Sequelize.INTEGER,
          required: true,
          references: { model: 'posts', key: 'id' }
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
