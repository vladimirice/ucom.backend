const TABLE_NAME = 'activity_user_user';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(TABLE_NAME, 'signed_transaction', {
      type: Sequelize.TEXT,
      required: false,
      allowNull: true
    }).then(() => {
      return queryInterface.addColumn(TABLE_NAME, 'blockchain_response', {
        type: Sequelize.TEXT,
        required: false,
        allowNull: true
      }).then(() => {
        return queryInterface.sequelize.query('ALTER TABLE activity_user_user ALTER COLUMN blockchain_status TYPE integer USING (blockchain_status::integer);');
      });
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(TABLE_NAME, 'signed_transaction')
      .then(() => {
        return queryInterface.removeColumn(TABLE_NAME, 'blockchain_response')
      });
  }
};
