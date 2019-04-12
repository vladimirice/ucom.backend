module.exports = (sequelize, DataTypes) => {
  const UsersEducation = sequelize.define('users_education', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
      // defaultValue: sequelize.literal("nextval('users_education_id_seq')")
    },
    title: {
      type: DataTypes.STRING,
    },
    speciality: {
      type: DataTypes.STRING
    },
    degree: {
      type: DataTypes.STRING,
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY
    },
    is_current: {
      type: DataTypes.BOOLEAN
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
    tableName: 'users_education',
    timestamps: false,
  });
  UsersEducation.associate = function(models) {
    models['users_education'].belongsTo(models.Users, {foreignKey: 'user_id'});
  };
  return UsersEducation;
};