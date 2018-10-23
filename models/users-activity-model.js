const TABLE_NAME = 'users_activity';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    activity_type_id: {
      type: Sequelize.SMALLINT,
      required: true,
    },
    activity_group_id: {
      type: Sequelize.SMALLINT,
      required: true,
    },
    user_id_from: {
      type: Sequelize.INTEGER,
      required: true,
    },
    entity_id_to: {
      type: Sequelize.INTEGER,
      required: true,
    },
    entity_name: {
      type: Sequelize.STRING,
      required: true,
    },
    signed_transaction: {
      type: Sequelize.TEXT
    },
    blockchain_response: {
      type: Sequelize.TEXT
    },
    blockchain_status: {
      type: Sequelize.INTEGER
    },
    entity_id_on: {
      type: Sequelize.BIGINT
    },
    entity_name_on: {
      type: Sequelize.CHAR(10)
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });
  Model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models.Users, {
      foreignKey: 'user_id_from',
      as: 'who_acts'
    });
  };
  return Model;
};