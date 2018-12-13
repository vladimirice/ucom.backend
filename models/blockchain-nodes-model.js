const TABLE_NAME = 'blockchain_nodes';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      required: true,
    },
    votes_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      required: false,
      defaultValue: 0,
    },
    votes_amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      required: false,
      defaultValue: 0,
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
      required: true,
    },
    bp_status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      required: true,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
      required: false
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    paranoid: true,
  });

  Model.getFieldsForPreview = function () {
    return [
      'id',
      'title',
      'votes_count',
      'votes_amount',

      'currency',
      'bp_status',
    ];
  };

  Model.getPostProcessingFields = function () {
    return [
      'votes_percentage',
    ];
  };

  return Model;
};