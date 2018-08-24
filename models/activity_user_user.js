module.exports = (sequelize, DataTypes) => {
  const ActivityUserUser = sequelize.define('activity_user_user', {
    activity_type_id: {
      type: DataTypes.INTEGER,
    },
    user_id_from: {
      type: DataTypes.INTEGER
    },
    user_id_to: {
      type: DataTypes.INTEGER
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'activity_user_user',
  });
  ActivityUserUser.associate = function(models) {
  };
  return ActivityUserUser;
};