const TABLE_NAME = 'uos_accounts_properties';

module.exports = (sequelize, DataTypes) => {
  const UosAccoutsProperties = sequelize.define(TABLE_NAME, {
    account_name: {
      type: DataTypes.STRING,
    },
    entity_name: {
      type: DataTypes.STRING,
    },
    entity_id: {
      type: DataTypes.BIGINT,
    },
    staked_balance: {
      type: DataTypes.BIGINT,
    },
    validity: {
      type: DataTypes.DECIMAL(20, 10),
    },
    importance: {
      type: DataTypes.DECIMAL(20, 10),
    },
    scaled_importance: {
      type: DataTypes.DECIMAL(20, 10),
    },
    stake_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    scaled_stake_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    social_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    scaled_social_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    transfer_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    scaled_transfer_rate: {
      type: DataTypes.DECIMAL(20, 10),
    },
    previous_cumulative_emission: {
      type: DataTypes.DECIMAL(20, 10),
    },
    current_emission: {
      type: DataTypes.DECIMAL(20, 10),
    },
    current_cumulative_emission: {
      type: DataTypes.DECIMAL(20, 10),
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    schema: 'blockchain',
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    timestamps: false,
  });

  return UosAccoutsProperties;
};
