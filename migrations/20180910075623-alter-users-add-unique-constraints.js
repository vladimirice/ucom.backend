const TABLE_NAME = 'Users';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(TABLE_NAME, 'account_name', {
      type: Sequelize.STRING,
      required: true,
      allowNull: false,
      unique: true
    })
      .then(() => {
        return queryInterface.changeColumn(TABLE_NAME, 'nickname', {
          type: Sequelize.STRING,
          required: true,
          allowNull: false,
          unique: true
        })
      })
      .then(() => {
        return queryInterface.changeColumn(TABLE_NAME, 'email', {
          type: Sequelize.STRING,
          required: false,
          allowNull: true,
          unique: true
        })
      })
      .then(() => {
        return queryInterface.changeColumn(TABLE_NAME, 'phone_number', {
          type: Sequelize.STRING,
          required: false,
          allowNull: true,
          unique: true
        })
      })
      .then(() => {
        return queryInterface.changeColumn(TABLE_NAME, 'public_key', {
          type: Sequelize.STRING,
          required: true,
          allowNull: false,
          unique: true
        })
      });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
