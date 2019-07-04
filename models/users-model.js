const TABLE_NAME = 'Users';

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(TABLE_NAME, {
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
      type: DataTypes.STRING,
    },
    is_tracking_allowed: {
      type: DataTypes.BOOLEAN,
    },
    entity_images: {
      type: DataTypes.JSONB,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    underscored: true,
    freezeTableName: true,
    tableName: 'Users',
    timestamps: false,
  });

  Users.associate = function(models) {
    models[TABLE_NAME].hasMany(models.users_education, {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_education",
        plural: "users_education"
      }
    });
    models.Users.hasMany(models.organizations, {
      foreignKey: 'user_id',
    });
    models[TABLE_NAME].hasMany(models.users_jobs, {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_jobs",
        plural: "users_jobs"
      }
    });
    models[TABLE_NAME].hasMany(models.users_sources, {
      foreignKey: 'user_id',
      sourceKey: 'id',
      as: {
        singular: "users_sources",
        plural: "users_sources"
      }
    });

    models[TABLE_NAME].hasOne(models['uos_accounts_properties'], { foreignKey: 'entity_id', as: 'uos_accounts_properties' });
    models[TABLE_NAME].hasOne(
      models['users_current_params'],
      {
        foreignKey: 'user_id', as: 'users_current_params',
      }
    );

    /**
     *
     * @return {string[]}
     */
    Users.getUsersUniqueFields = function () {
      // #task parse schema instead
      return [
        'phone_number',
        'email'
      ];
    };


    Users.getSensitiveData = function() {
      return [
        'private_key',
        'blockchain_registration_status',
        'owner_public_key',
        'public_key'
      ];
    };

    /**
     *
     * @returns {string[]}
     */
    Users.getFieldsForPreview = function() {
      return [
        'id',
        'account_name',
        'first_name',
        'last_name',
        'nickname',
        'avatar_filename',
        'current_rate',
        'entity_images',
      ];
    };
  };

  return Users;
};
