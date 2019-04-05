/* eslint-disable security/detect-object-injection */
const TABLE_NAME = 'comments';

module.exports = (database, Sequelize) => {
  const Model = database.define(TABLE_NAME, {
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      required: true,
    },
    current_vote: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    path: {
      type: Sequelize.JSONB,
      allowNull: true,
    },
    commentable_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    blockchain_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    blockchain_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    parent_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    depth: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    organization_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      required: false,
    },
    entity_images: {
      type: Sequelize.JSONB,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  Model.associate = (models) => {
    models[TABLE_NAME].belongsTo(models.organizations, { foreignKey: 'organization_id' });

    models[TABLE_NAME].belongsTo(models.Users, { foreignKey: 'user_id' });
    models[TABLE_NAME].belongsTo(models.posts, { foreignKey: 'commentable_id' });
    models[TABLE_NAME].hasMany(models.activity_user_comment, {
      foreignKey: 'comment_id_to',
      as: {
        singular: 'activity_user_comment',
        plural: 'activity_user_comment',
      },
    });
  };

  Model.getFieldsForPreview = () => [
    'id',
    'description',
    'current_vote',
    'path',
    'parent_id',
    'depth',
    'created_at',
    'updated_at',
    'organization_id',
    'user_id',
    'commentable_id',
    'blockchain_id',
  ];

  Model.apiResponseFields = () => [
    'id',
    'description',
    'current_vote',
    'path',
    'parent_id',
    'depth',
    'created_at',
    'updated_at',
    'User',
    'organization',
    'organization_id',
  ];

  return Model;
};
