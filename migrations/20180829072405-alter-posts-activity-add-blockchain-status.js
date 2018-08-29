
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('posts', 'blockchain_status', {
      type: Sequelize.STRING,
      required: false,
      allowNull: true,
      defaultValue: 0
    })
      .then(() => {
        return queryInterface.addColumn('activity_user_user', 'blockchain_status', {
          type: Sequelize.STRING,
          required: false,
          allowNull: true,
          defaultValue: 0
        })
      })
      .then(() => {
        return queryInterface.addColumn('activity_user_post', 'blockchain_status', {
          type: Sequelize.STRING,
          required: false,
          allowNull: true,
          defaultValue: 0
        })
      })
  ;
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('posts', 'blockchain_status')
      .then(() => {
        return queryInterface.removeColumn('activity_user_user', 'blockchain_status')
      })
      .then(() => {
        return queryInterface.removeColumn('activity_user_post', 'blockchain_status')
      })
  }
};
