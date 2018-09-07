module.exports = (sequelize, DataTypes) => {
  const UsersJobs = sequelize.define('users_jobs', {
    title: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY
    },
    is_current: {
      type: DataTypes.BOOLEAN
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'users_jobs',
  });
  UsersJobs.associate = function(models) {
    // models['users_jobs'].belongsTo(models.Users, {foreignKey: 'user_id'});
  };
  return UsersJobs;
};