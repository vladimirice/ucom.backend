'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    account_name: {
      type: DataTypes.STRING,
    },
    nickname: {
      type: DataTypes.STRING
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          args: true,
          msg: 'Email is invalid'
        },
      }
    },
    phone_number: {
      type: DataTypes.STRING
    },
    birthday: {
      type: DataTypes.DATEONLY
    },
    about: {
      type: DataTypes.TEXT
    },
    country: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.STRING
    },
    mood_message: {
      type: DataTypes.STRING
    },
    avatar_filename: {
      type: DataTypes.STRING
    },
    public_key: {
      type: DataTypes.STRING
    },
    currency_to_show: {
      type: DataTypes.STRING
    },
    first_currency: {
      type: DataTypes.STRING
    },
    first_currency_year: {
      type: DataTypes.STRING
    },
    personal_website_url: {
      type: DataTypes.STRING
    },
    achievements_filename: {
      type: DataTypes.STRING
    },
    current_rate: {
      type: DataTypes.DECIMAL(10, 10)
    },
    private_key: {
      type: DataTypes.STRING
    },
    blockchain_registration_status: {
      type: DataTypes.INTEGER
    },
    owner_public_key: {
      type: DataTypes.STRING
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'Users',
  });
  Users.associate = function(models) {
    models['Users'].hasMany(models['users_education'], {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_education",
        plural: "users_education"
      }
    });
    models['Users'].hasMany(models['users_jobs'], {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_jobs",
        plural: "users_jobs"
      }
    });
    models['Users'].hasMany(models['users_sources'], {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_sources",
        plural: "users_sources"
      }
    });

    models['Users'].hasMany(models['activity_user_user'], {
      foreignKey: 'user_id_from',
      sourceKey: 'id',
      as: {
        singular: "I_follow",
        plural: "I_follow"
      }
    });
    models['Users'].hasMany(models['activity_user_user'], {
      foreignKey: 'user_id_to',
      sourceKey: 'id',
      as: {
        singular: "followed_by",
        plural: "followed_by"
      }
    });

    Users.shortUserInfoFields = function() {
      return [
        'id', 'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
      ];
    };
  };

  return Users;
};