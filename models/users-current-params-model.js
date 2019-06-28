const TABLE_NAME = 'users_current_params';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(TABLE_NAME, {
    user_id: {
      type: DataTypes.INTEGER,
    },
    posts_current_amount_delta: {
      type: DataTypes.BIGINT,
    },
    scaled_importance_delta: {
      type: DataTypes.DECIMAL(20, 10),
    },
    scaled_social_rate_delta: {
      type: DataTypes.DECIMAL(20, 10),
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    timestamps: false,
  });
};
