const TABLE_NAME = 'entity_stats_current';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    entity_id: {
      type: Sequelize.INTEGER,
      required: true,
    },
    entity_name: {
      type: Sequelize.STRING,
      required: true,
    },
    importance_delta: {
      type: Sequelize.DECIMAL(20, 10),
    },
    upvote_delta: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    timestamps: false,
  });

  Model.associate = function(models) {
    // #task - now stats is for posts only
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'entity_id'});
  };

  return Model;
};