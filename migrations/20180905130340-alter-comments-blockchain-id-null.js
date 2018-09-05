const TABLE_NAME = 'comments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(TABLE_NAME, 'blockchain_id', {
      type: Sequelize.STRING,
      allowNull: true,
    })
      .then(() => {
        return queryInterface.changeColumn(TABLE_NAME, 'path', {
          type: Sequelize.STRING,
          allowNull: true,
        })
      })
      ;
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
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
