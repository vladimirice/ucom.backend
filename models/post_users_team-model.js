const TABLE_NAME = 'post_users_team';

module.exports = (db) => {
  const model = db.define(TABLE_NAME, {
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    timestamps: false,
  });
  model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'post_id'});
    models[TABLE_NAME].belongsTo(models['Users'], {foreignKey: 'user_id'});
  };
  return model;
};