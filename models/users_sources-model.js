module.exports = (sequelize, DataTypes) => {
  const UsersSources = sequelize.define('users_sources', {
    source_url: {
      type: DataTypes.STRING,
    },
    is_official: {
      type: DataTypes.BOOLEAN,
    },
    source_type_id: {
      type: DataTypes.INTEGER,
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
    tableName: 'users_sources',
    timestamps: false,
  });
  UsersSources.associate = function(models) {
  };
  return UsersSources;
};
