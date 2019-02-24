/* eslint-disable security/detect-object-injection */
const TABLE_NAME = 'posts_current_params';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    post_id: {
      type: Sequelize.BIGINT,
    },
    importance_delta: {
      type: Sequelize.DECIMAL(20, 10),
    },
    activity_index_delta: {
      type: Sequelize.DECIMAL(20, 10),
    },
    upvotes_delta: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  Model.associate = (models) => {
    // #task - now stats is for posts only
    models[TABLE_NAME].belongsTo(models.posts, {
      foreignKey: 'post_id',
    });
  };

  return Model;
};
