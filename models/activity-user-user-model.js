const TABLE_NAME = 'activity_user_user';

module.exports = (sequelize, DataTypes) => {
  const ActivityUserUser = sequelize.define(TABLE_NAME, {
    activity_type_id: {
      type: DataTypes.INTEGER,
    },
    user_id_from: {
      type: DataTypes.INTEGER
    },
    user_id_to: {
      type: DataTypes.INTEGER
    },
    blockchain_status: {
      type: DataTypes.INTEGER
    },
    signed_transaction: {
      type: DataTypes.TEXT
    },
    blockchain_response: {
      type: DataTypes.TEXT
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });
  ActivityUserUser.associate = function(models) {
    models[TABLE_NAME].belongsTo(models.Users, {
      foreignKey: 'user_id_from',
      as: 'follower'
    });

    models[TABLE_NAME].belongsTo(models.Users, {
      foreignKey: 'user_id_to',
      as: 'is_followed'
    });
  };
  return ActivityUserUser;
};