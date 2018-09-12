const TABLE_NAME = 'activity_user_comment';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(TABLE_NAME, {
    activity_type_id: {
      type: DataTypes.INTEGER,
    },
    user_id_from: {
      type: DataTypes.INTEGER
    },
    comment_id_to: {
      type: DataTypes.INTEGER
    },
    blockchain_status: {
      type: DataTypes.INTEGER
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });
  Model.associate = function(models) {

  };

  return Model;
};