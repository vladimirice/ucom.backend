// TODO  #refactor - merge with passportjs

const AuthService = require('./authService');

const setCurrentUser = function (req, res, next) {
  AuthService.setCurrentUserByToken(req);
  next();
};

module.exports = setCurrentUser;