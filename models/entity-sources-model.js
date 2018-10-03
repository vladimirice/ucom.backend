const TABLE_NAME = 'entity_sources';

module.exports = (sequelize, DataTypes) => {
  // noinspection UnnecessaryLocalVariableJS
  const Model = sequelize.define(TABLE_NAME, {
    source_url: {
      type: DataTypes.STRING,
    },
    is_official: {
      type: DataTypes.BOOLEAN
    },
    source_type_id: {
      type: DataTypes.SMALLINT,
    },
    source_group_id: {
      type: DataTypes.SMALLINT,
    },
    entity_id: {
      type: DataTypes.BIGINT,
    },
    entity_name: {
      type: DataTypes.STRING
    },
    source_entity_id: {
      type: DataTypes.BIGINT
    },
    source_entity_name: {
      type: DataTypes.STRING
    },
    text_data: {
      type: DataTypes.TEXT
    },
    avatar_filename: {
      type: DataTypes.STRING,
      required: false,
      allowNull: true,
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  return Model;
};