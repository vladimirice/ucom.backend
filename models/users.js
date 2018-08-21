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
  }, {
    underscored: true,
  });
  Users.associate = function(models) {
    // associations can be defined here
  };
  return Users;
};