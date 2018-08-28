
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('posts', 'blockchain_id', {
      type: Sequelize.STRING,
      required: false,
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('posts', 'blockchain_id');
  }
};
