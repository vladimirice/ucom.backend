
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'currency_to_show', {
      type: Sequelize.STRING,
      required: false,
    }).then(() => {

     return queryInterface.addColumn('Users', 'first_currency', {
        type: Sequelize.STRING,
        required: false,
     })
    }).then(() => {
      return queryInterface.addColumn('Users', 'first_currency_year', {
        type: Sequelize.STRING,
        required: false,
      })
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'currency_to_show');
    queryInterface.removeColumn('Users', 'first_currency');
    queryInterface.removeColumn('Users', 'first_currency_year');

    return queryInterface;
  }
};
