const TABLE_NAME = 'users_sources';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      source_url: {
        type: Sequelize.STRING,
      },
      is_official: {
        type: Sequelize.BOOLEAN
      },
      source_type_id: {
        type: Sequelize.INTEGER,
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

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
