const TABLE_NAME = 'entity_notifications';

module.exports = (sequelize, DataTypes) => {
  // noinspection UnnecessaryLocalVariableJS
  const Model = sequelize.define(TABLE_NAME, {
    domain_id: {
      type: DataTypes.SMALLINT,
    },
    event_id: {
      type: DataTypes.SMALLINT
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
      type: DataTypes.BOOLEAN
    },
    confirmed: {
      type: DataTypes.SMALLINT
    },
    severity: {
      type: DataTypes.SMALLINT
    },
    notification_type_id: {
      type: DataTypes.SMALLINT
    },
    recipient_entity_id: {
      type: DataTypes.BIGINT
    },
    recipient_entity_name: {
      type: DataTypes.CHAR(10)
    },
    entity_id: {
      type: DataTypes.BIGINT
    },
    entity_name: {
      type: DataTypes.CHAR(10)
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  /**
   *
   * @return {Array}
   */
  Model.getRequiredFields = function () {
    return [
      'id',
      'domain_id',
      'event_id',
      'finished',
      'seen',
      'confirmed',
      'severity',
      'notification_type_id',
      'recipient_entity_id',
      'recipient_entity_name',
      'entity_id',
      'entity_name',
      'created_at',
      'updated_at'
    ];
  };

  Model.associate = function(models) {
    // TODO - this is temp solution because entity ID might be not only organization
    models[TABLE_NAME].belongsTo(models['organizations'], {foreignKey: 'entity_id'});
  };

  return Model;
};