module.exports = (sequelize, DataTypes) => {
  const ActivityUserUser = sequelize.define('activity_user_post', {
    activity_type_id: {
      type: DataTypes.INTEGER,
    },
    user_id_from: {
      type: DataTypes.INTEGER
    },
    post_id_to: {
      type: DataTypes.INTEGER
    },
    blockchain_status: {
      type: DataTypes.INTEGER
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'activity_user_post',
  });
  ActivityUserUser.associate = function(models) {
  };
  return ActivityUserUser;
};