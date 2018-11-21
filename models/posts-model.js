const TABLE_NAME = 'posts';

const _ = require('lodash');

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
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      required: false
    },
    entity_id_for: {
      type: DataTypes.BIGINT,
    },
    entity_name_for: {
      type: DataTypes.STRING,
    },
    parent_id: {
      type: DataTypes.INTEGER,
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  Posts.getMediaPostFullFields = function () {
    return [
      'id',
      'post_type_id',
      'title',
      'description',
      'main_image_filename',
      'current_vote',
      'current_rate',
      'created_at',
      'updated_at',
      'user_id',
      'leading_text',
      'blockchain_id',
      'organization_id',

      'entity_id_for',
      'entity_name_for',

      'comments_count'
    ];
  };

  Posts.getPostOfferFullFields = function () {
    return _.concat(
      Posts.getMediaPostFullFields(),
      [
        'action_button_title',
        'action_button_url',
        'action_duration_in_days',

        'post_users_team',
      ]
    );
  };

  /**
   *
   * @returns {string[]}
   */
  Posts.getFieldsForPreview = function () {
    return [
      'id',
      'title',
      'description',
      'leading_text',
      'current_vote',
      'current_rate',
      'main_image_filename',
      'user_id',
      'post_type_id',
      'blockchain_id',
      'organization_id',
      'created_at',
      'updated_at',

      'entity_id_for',
      'entity_name_for',
    ];
  };

  Posts.getHtmlFields = function () {
    return [
      'description',
    ];
  };

  Posts.getSimpleTextFields = function () {
    return [
      'title',
      'leading_text'
    ];
  };

  /**
   *
   * @return {string[]}
   */
  Posts.getFieldsToExcludeFromDirectPost = function () {
    return [
      'title',
      'leading_text',
      'blockchain_status'
    ];
  };

  /**
   *
   * @return {string[]}
   */
  Posts.getDirectPostNotNullFields = function () {
    return [
      'id',
      'post_type_id',
      'description',
      'current_vote',
      'current_rate',
      'created_at',
      'updated_at',
      'user_id',
      'blockchain_id',
      'comments_count',

      'entity_id_for',
      'entity_name_for',
    ];
  };

  /**
   * @deprecated
   * rearrange this structure
   * @return {string[]}
   */
  Posts.getMediaOrOfferPostMustExistFields = function () {
    return _.concat(
      Posts.getFieldsForPreview(),
      'comments_count',
    );
  };

  /**
   * @return {string[]}
   */
  Posts.getFieldsRequiredForNotification = function () {
    return Posts.getFieldsForPreview();
  };

  Posts.getPostOfferMustExistFields = function() {
    return [
      'action_button_title',
      'action_button_url',
      'action_duration_in_days',

      'post_users_team',
    ];
  };

  Posts.getMediaPostAttributesForIpfs = function() {
    return [
      'id',
      'title',
      'leading_text',
      'description',
      'user_id', // better to use account name
      'main_image_filename', // better to store full url and save image to ipfs
      'post_type_id',
      'blockchain_id',
      'created_at',
      'updated_at',
    ];
  };

  Posts.getFieldsForJob = function () {
    return [
      'id', // Should be generated for ipfs separately
      'title',
      'leading_text',
      'description',
      'user_id', // better to use account name
      'main_image_filename', // better to store full url and save image to ipfs
      'post_type_id',
      'blockchain_id',
      'created_at',
      'updated_at',
    ];
  };

  Posts.associate = function(models) {
    models[TABLE_NAME].belongsTo(models['Users'], {foreignKey: 'user_id'});

    models[TABLE_NAME].belongsTo(models['organizations'], {foreignKey: 'organization_id'});

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
    models[TABLE_NAME].hasOne(models['post_stats'], {
      foreignKey: 'post_id',
      as: 'post_stats'
    });

    models[TABLE_NAME].belongsTo(models[TABLE_NAME], {
      foreignKey: 'parent_id',
      as: 'post'
    });
  };

  return Posts;
};