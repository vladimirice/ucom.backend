const TABLE_NAME = 'post_offer';

module.exports = (db, Sequelize) => {
  const UsersEducation = db.define(TABLE_NAME, {
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
  UsersEducation.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'post_id'});
  };
  return UsersEducation;
};