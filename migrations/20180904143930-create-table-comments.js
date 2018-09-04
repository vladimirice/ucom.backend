const TABLE_NAME = 'comments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        required: true,
      },
      current_vote: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      path: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      commentable_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      blockchain_status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      blockchain_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'parent_id', {
          type: Sequelize.INTEGER,
          required: false,
          allowNull: true,
          references: { model: TABLE_NAME, key: 'id' }
        }
      );
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'user_id', {
          type: Sequelize.INTEGER,
          required: true,
          allowNull: false,
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
