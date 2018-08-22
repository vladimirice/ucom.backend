
module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.createTable('users_education', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
      },
      speciality: {
        type: Sequelize.STRING
      },
      degree: {
        type: Sequelize.STRING,
      },
      start_date: {
        type: Sequelize.DATEONLY,
      },
      end_date: {
        type: Sequelize.DATEONLY
      },
      is_current: {
        type: Sequelize.BOOLEAN
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => {
      return queryInterface.addColumn('users_education', 'user_id', {
          type: Sequelize.INTEGER,
          required: true,
          references: { model: 'Users', key: 'id' }
        }
      );
    }).catch((err) => {
      throw new Error(err);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users_education');
  }
};
