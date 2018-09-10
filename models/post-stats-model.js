const TABLE_NAME = 'post_stats';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    comments_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    post_id: {
      type: Sequelize.INTEGER
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });
  Model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'post_id'});
  };
  return Model;
};