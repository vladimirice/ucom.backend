const TABLE_NAME = 'comments';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      required: true,
    },
    current_vote: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    path: {
      type: Sequelize.JSONB,
      allowNull: true,
    },
    commentable_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    blockchain_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
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
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });

  Model.associate = function(models) {
    models[TABLE_NAME].belongsTo(models.Users, {foreignKey: 'user_id'});
    models[TABLE_NAME].belongsTo(models['posts'], {foreignKey: 'commentable_id'});
  };

  Model.apiResponseFields = function() {
    return [
      'id',
      'description',
      'current_vote',
      'path',
      'parent_id',
      'created_at',
      'updated_at',
      'User'
    ];
  };

  Model.prototype.toApiResponseJson = function() {
    this.path = this.path.replace('[', '');
    this.path = this.path.replace(']', '');
    this.path = this.path.replace(/,/g, '');

    let result = {};
    Model.apiResponseFields().forEach(attribute => {
      result[attribute] = this[attribute];
    });

    result['User'] = result['User'].toJSON();

    return result;
  };

  return Model;
};