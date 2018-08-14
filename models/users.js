'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    email: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING(1024)
    },
    nickname: {
      type: DataTypes.STRING
    },
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    phone_number: {
      type: DataTypes.STRING
    },
    logo_url: {
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
    referral_url: {
      type: DataTypes.STRING
    },
    mood_message: {
      type: DataTypes.STRING
    },
    user_rate: {
      type: DataTypes.DECIMAL(10, 2)
    },
    user_rate_position: {
      type: DataTypes.INTEGER
    },
  }, {
    underscored: true,
  });
  Users.associate = function(models) {
    // associations can be defined here
  };
  return Users;
};