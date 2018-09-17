const TABLE_NAME = 'ipfs_meta';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ipfs_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ipfs_status: {
        type: Sequelize.INTEGER,
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
      return queryInterface.addColumn(TABLE_NAME, 'post_id', {
          type: Sequelize.INTEGER,
          required: true,
          allowNull: false,
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
