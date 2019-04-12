module.exports = (sequelize, DataTypes) => {
  const UsersJobs = sequelize.define('users_jobs', {
    title: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING,
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY,
    },
    is_current: {
      type: DataTypes.BOOLEAN,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'users_jobs',
    timestamps: false,
  });
  UsersJobs.associate = function(models) {
    // models['users_jobs'].belongsTo(models.Users, {foreignKey: 'user_id'});
  };
  return UsersJobs;
};