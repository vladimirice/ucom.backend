const TABLE_NAME = 'posts';
const moment = require('moment');
const sanitizeHtml = require('sanitize-html');

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
    }
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
      'description',
      'leading_text',
      'current_vote',
      'current_rate',
      'main_image_filename',
      'user_id',
      'post_type_id'
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

  /**
   * @deprecated
   * @param {Object} modelAsObject - object not model
   * @returns {string} json string
   */
  Posts.getPayloadForJob = function (modelAsObject) {
    const fields = Posts.getFieldsForJob();

    const forJson = _.pick(modelAsObject, fields);

    forJson['created_at'] = parseInt(moment(forJson['created_at']).valueOf() / 1000);
    forJson['updated_at'] = parseInt(moment(forJson['updated_at']).valueOf() / 1000);

    return JSON.stringify(forJson);
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
  };

  return Posts;
};