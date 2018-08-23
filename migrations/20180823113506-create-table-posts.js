const TABLE_NAME = 'posts';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      post_type_id: {
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT,
      },
      main_image_filename: {
        type: Sequelize.STRING
      },
      current_vote: {
        type: Sequelize.INTEGER
      },
      current_rate: {
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
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
