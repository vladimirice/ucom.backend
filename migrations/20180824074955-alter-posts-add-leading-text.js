module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('posts', 'leading_text', {
      type: Sequelize.STRING,
      required: false,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('posts', 'leading_text');
  }
};
