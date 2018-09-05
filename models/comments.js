const TABLE_NAME = 'comments';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      required: true,
    },
    current_vote: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    path: {
      type: Sequelize.JSONB,
      allowNull: true,
    },
    commentable_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    blockchain_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    blockchain_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    parent_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
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