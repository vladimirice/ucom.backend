const TABLE_NAME        = 'users_team';
const USERS_TABLE_NAME  = 'Users';

module.exports = (db, Sequelize) => {
  const model = db.define(TABLE_NAME, {
    user_id: {
      type: Sequelize.INTEGER
    },
    entity_id: {
      type: Sequelize.BIGINT
    },
    entity_name: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.SMALLINT
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
  model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models[USERS_TABLE_NAME], {foreignKey: 'user_id'});
  };
  return model;
};