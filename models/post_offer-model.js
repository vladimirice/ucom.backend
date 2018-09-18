const TABLE_NAME = 'post_offer';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    action_button_title: {
      type: Sequelize.STRING,
    },
    action_button_url: {
      type: Sequelize.STRING
    },
    action_duration_in_days: {
      type: Sequelize.INTEGER,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
    timestamps: false,
  });
  Model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'post_id'});
  };

  Model.getSimpleTextFields = function () {
    return [
      'action_button_title',
      'action_button_url',
    ];
  };

  Model.getPostOfferAttributesForIpfs = function() {
    return [
      'action_button_title',
      'action_button_url',
      'action_duration_in_days'
    ];
  };

  return Model;
};