module.exports = (sequelize, DataTypes) => {
  const UsersSources = sequelize.define('users_sources', {
    source_url: {
      type: DataTypes.STRING,
    },
    is_official: {
      type: DataTypes.BOOLEAN
    },
    source_type_id: {
      type: DataTypes.INTEGER,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'users_sources',
  });
  UsersSources.associate = function(models) {
  };
  return UsersSources;
};