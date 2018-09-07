const TABLE_NAME = 'posts';

module.exports = (sequelize, DataTypes) => {
  const Posts = sequelize.define(TABLE_NAME, {
    post_type_id: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT,
    },
    main_image_filename: {
      type: DataTypes.STRING
    },
    current_vote: {
      type: DataTypes.STRING
    },
    current_rate: {
      type: DataTypes.STRING
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    leading_text: {
      type: DataTypes.TEXT
    },
    blockchain_id: {
      type: DataTypes.STRING
    },
    blockchain_status: {
      type: DataTypes.INTEGER
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  /**
   *
   * @returns {string[]}
   */
  Posts.getFieldsForPreview = function () {
    return [
      'id',
      'title',
      'current_vote',
      'current_rate',
      'main_image_filename'
    ];
  };

  Posts.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['Users'], {foreignKey: 'user_id'});
    models[TABLE_NAME].hasMany(models['comments'], {
      foreignKey: 'commentable_id',
      as: {
        singular: "comments",
        plural: "comments"
      }
    });
    models[TABLE_NAME].hasMany(models['activity_user_post'], {foreignKey: 'post_id_to'});
    models[TABLE_NAME].hasOne(models['post_offer'], {foreignKey: 'post_id'});
    models[TABLE_NAME].hasMany(models['post_users_team'], {
      foreignKey: 'post_id',
      as: {
        singular: "post_users_team",
        plural: "post_users_team"
      }
    });
  };

  return Posts;
};