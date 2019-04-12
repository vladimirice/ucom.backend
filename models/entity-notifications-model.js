const TABLE_NAME = 'entity_notifications';

const _ = require('lodash');

module.exports = (sequelize, DataTypes) => {
  // noinspection UnnecessaryLocalVariableJS
  const Model = sequelize.define(TABLE_NAME, {
    domain_id: {
      type: DataTypes.SMALLINT,
    },
    event_id: {
      type: DataTypes.SMALLINT,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    finished: {
      type: DataTypes.BOOLEAN,
    },
    seen: {
      type: DataTypes.BOOLEAN,
    },
    confirmed: {
      type: DataTypes.SMALLINT,
    },
    severity: {
      type: DataTypes.SMALLINT,
    },
    notification_type_id: {
      type: DataTypes.SMALLINT,
    },
    recipient_entity_id: {
      type: DataTypes.BIGINT,
    },
    recipient_entity_name: {
      type: DataTypes.CHAR(10),
    },
    entity_id: {
      type: DataTypes.BIGINT,
    },
    entity_name: {
      type: DataTypes.CHAR(10),
    },
    target_entity_name: {
      type: DataTypes.CHAR(10),
    },
    target_entity_id: {
      type: DataTypes.BIGINT,
    },
    users_activity_id: {
      type: DataTypes.INTEGER,
    },
    user_id_from: {
      type: DataTypes.INTEGER,
    },
    json_body: {
      type: DataTypes.JSONB,
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
    tableName: TABLE_NAME,
    timestamps: false,
  });

  /**
   *
   * @return {Array}
   */
  Model.getRequiredFields = function () {
    return [
      'id',
      'event_id',
      'finished',
      'confirmed',
      'recipient_entity_id',
      'recipient_entity_name',
      'created_at',
      // 'domain_id',
      // 'seen',
      // 'severity',
      // 'notification_type_id',
      'entity_id',
      'entity_name',
      // 'updated_at',
    ];
  };

  Model.getRequiredFieldsToProcess = function () {
    return _.concat(Model.getRequiredFields(), 'json_body');
  };

  Model.associate = function(models) {
    // #task - this is temp solution because entity ID might be not only organization
    models[TABLE_NAME].belongsTo(models['organizations'], {foreignKey: 'entity_id'});
    models[TABLE_NAME].belongsTo(models.Users, {foreignKey: 'target_entity_id'});
  };

  return Model;
};