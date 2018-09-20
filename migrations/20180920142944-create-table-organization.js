const TABLE_NAME = 'organizations';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      avatar_filename: {
        type: Sequelize.STRING,
        required: false,
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        required: true
      },
      currency_to_show: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      powered_by: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: true,
        required: false,
      },
      nickname: {
        type: Sequelize.STRING,
        allowNull: false,
        required: true,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
        unique: true,
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
      },
      personal_website_url: {
        type: Sequelize.STRING,
        allowNull: true,
        required: false,
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
    })
      .then(() => {
        return queryInterface.addColumn(TABLE_NAME, 'user_id', {
          type: Sequelize.INTEGER,
          required: true,
          allowNull: false,
          references: { model: 'Users', key: 'id' }
        });
      });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};