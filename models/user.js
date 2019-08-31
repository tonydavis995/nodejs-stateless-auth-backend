
var bcrypt = require('bcryptjs')
module.exports = (sequelize, dataTypes) => {
  var User = sequelize.define('User', {
    email: {
      type: dataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: dataTypes.STRING,
      allowNull: false
    },
    password: {
      type: dataTypes.STRING
    }
  })
  User.associate = (models) => {
    User.hasMany(models.Provider)
  }
  return User
}