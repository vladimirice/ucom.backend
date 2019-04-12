const TABLE_NAME = 'organizations';
const USERS_TEAM_TABLE_NAME = 'users_team';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    avatar_filename: {
      type: Sequelize.STRING,
    },
    title: {
      type: Sequelize.STRING,
    },
    currency_to_show: {
      type: Sequelize.STRING,
    },
    powered_by: {
      type: Sequelize.STRING,
    },
    about: {
      type: Sequelize.TEXT,
    },
    nickname: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    phone_number: {
      type: Sequelize.STRING,
    },
    country: {
      type: Sequelize.STRING,
    },
    city: {
      type: Sequelize.STRING,
    },
    address: {
      type: Sequelize.STRING,
    },
    personal_website_url: {
      type: Sequelize.STRING,
    },
    blockchain_id: {
      type: Sequelize.STRING,
    },
    current_rate: {
      type: Sequelize.DECIMAL(10, 10)
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

  /**
   *
   * @return {string[]}
   */
  Model.getUniqueFields = function () {
    // #task parse schema instead
    return [
      'nickname',
      'email'
    ];
  };

  /**
   *
   * @returns {string[]}
   */
  Model.getFieldsForPreview = function () {
    return [
      'id',
      'title',
      'avatar_filename',
      'nickname',
      'current_rate',
      'user_id',
      'powered_by',
      'about',
    ];
  };

  /**
   *
   * @return {string[]}
   */
  Model.getFieldsForSearch = function() {
    return [
      'title',
      'nickname'
    ];
  };

  Model.getHtmlFields = function () {
    return [];
  };

  /**
   *
   * @return {string[]}
   */
  Model.getSimpleTextFields = function () {
    return [
      'title',
      'currency_to_show',
      'powered_by',
      'about',
      'nickname',
      'email',
      'phone_number',
      'country',
      'city',
      'address',
      'personal_website_url',
    ];
  };

  Model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models.Users, {foreignKey: 'user_id'});

    models[TABLE_NAME].hasMany(models[USERS_TEAM_TABLE_NAME], {
      foreignKey: 'entity_id',
      as: {
        singular: USERS_TEAM_TABLE_NAME,
        plural: USERS_TEAM_TABLE_NAME,
      }
    });

    // models[TABLE_NAME].hasMany(models['activity_user_post'], {foreignKey: 'post_id_to'});
    // models[TABLE_NAME].hasMany(models['post_users_team'], {
    //   foreignKey: 'post_id',
    //   as: {
    //     singular: "post_users_team",
    //     plural: "post_users_team"
    //   }
    // });
  };

  return Model;
};