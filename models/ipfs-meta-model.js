const TABLE_NAME = 'ipfs_meta';

module.exports = (db, Sequelize) => {
  const Model = db.define(TABLE_NAME, {
    path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    ipfs_size: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    ipfs_status: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    post_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    }
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: TABLE_NAME,
  });
  Model.associate = function(models) {
  };
  return Model;
};